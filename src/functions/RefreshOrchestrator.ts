import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';
import { DateTime } from "luxon";

const refresh: OrchestrationHandler = function* (context: OrchestrationContext) {
    const input = context.df.getInput<string>();

    const mkt = input['mkt'];
    const topics: string[] = yield callSearchBingActivity(context, mkt);

    const count = input["BraveAPIRate"];
    const country = input["country"];
    const searchLang = input["searchLang"];
    const uiLang = input["uiLang"];
    const newsOfTopics = [];
    for (let begin = 0; begin < topics.length; begin += count) {
        const deadline = DateTime.fromJSDate(context.df.currentUtcDateTime, {zone: 'utc'}).plus({seconds: 1});
        const tasks = callSearchBraveActivities(context, topics, begin, count, country, searchLang, uiLang);
        tasks.push(context.df.createTimer(deadline.toJSDate()));
        const results: any[] = yield context.df.Task.all(tasks);
        results.pop();
        newsOfTopics.push(...results);
    }

    const newsRelevance: any[] = yield context.df.Task.all(callFilterNewsActivities(context, newsOfTopics));

    const relevantNewsResultsByTopics = groupRelevantNewsByTopic(newsRelevance);

    const newsSummaries: any[] = yield context.df.Task.all(callSummarizeNewsActivities(context, relevantNewsResultsByTopics));

    const time = context.df.currentUtcDateTime;
    return yield callCacheSummariesActivity(context, mkt, time, newsSummaries);
};

const callSearchBingActivity = (context: OrchestrationContext, mkt: string): df.Task => {
    const bingSearchInput = {"mkt": mkt};
    return context.df.callActivity('SearchBingActivity', bingSearchInput);
};

const callSearchBraveActivities = (
    context: OrchestrationContext, 
    topics: string[], begin: number, count: number, 
    country: string, searchLang: string, uiLang: string
): df.Task[] => {
    const end = Math.min(begin + count, topics.length);
    const braveSearchTasks = [];
    for (let index = begin; index < end; index++) {
        const braveSearchInput = {
            "q": topics[index],
            "country": country,
            "searchLang": searchLang,
            "uiLang": uiLang
        };
        braveSearchTasks.push(context.df.callActivity('SearchBraveActivity', braveSearchInput));
    }
    return braveSearchTasks;
};

const callFilterNewsActivities = (context: OrchestrationContext, newsOfTopics: any[]): df.Task[] => {
    const filterNewsTasks = [];
    for (let newsOfTopic of newsOfTopics) {
        const topic = newsOfTopic['topic'];
        for (let newsResult of newsOfTopic['newsResults']) {
            if (!newsResult['extra_snippets']) {
                continue;
            }
            const filterNewsInput = {topic: topic, newsResult: newsResult};
            filterNewsTasks.push(context.df.callActivity('FilterNewsActivity', filterNewsInput));
        }
    }
    return filterNewsTasks;
};

const groupRelevantNewsByTopic = (newsRelevance: any[]): Map<string, any[]> => {
    const relevantNewsResultsByTopics = new Map<string, any[]>();
    for (let relevance of newsRelevance) {
        if (!relevance['relevant']) {
            continue;
        }
        const topic = relevance['topic'];
        const newsResult = relevance['newsResult'];
        if (relevantNewsResultsByTopics.has(topic)) {
            relevantNewsResultsByTopics.get(topic).push(newsResult);
        } else {
            relevantNewsResultsByTopics.set(topic, [newsResult]);
        }
    }
    return relevantNewsResultsByTopics;
};

const callSummarizeNewsActivities = (
    context: OrchestrationContext, relevantNewsResultsByTopics: Map<string, any[]>
): df.Task[] => {
    const summarizeNewsTasks = [];
    for (let [topic, relevantNewsResults] of relevantNewsResultsByTopics) {
        const summarizeNewsInput = {topic: topic, relevantNewsResults: relevantNewsResults};
        summarizeNewsTasks.push(context.df.callActivity('SummarizeNewsActivity', summarizeNewsInput));
    }
    return summarizeNewsTasks;
};

const callCacheSummariesActivity = (
    context: OrchestrationContext, mkt: string, time: Date, newsSummaries: any[]
): df.Task => {
    const timeString = time.toJSON();
    const cacheSummariesInput = {mkt: mkt, time: timeString, newsSummaries: newsSummaries};
    return context.df.callActivity('CacheSummariesActivity', cacheSummariesInput);
};

df.app.orchestration('RefreshOrchestrator', refresh);
