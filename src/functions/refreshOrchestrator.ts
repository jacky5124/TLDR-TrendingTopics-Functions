import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';
import { DateTime } from "luxon";

const refresh: OrchestrationHandler = function* (context: OrchestrationContext) {
    const input = context.df.getInput<string>();

    const mkt = input['mkt'];
    const bingSearchInput = {"mkt": mkt};
    const topics: string[] = yield context.df.callActivity('SearchBingActivity', bingSearchInput);

    const newsOfTopics = [];
    const numTopicsPerBatch = input["BraveAPIRate"];
    const numBatches = Math.ceil(topics.length / numTopicsPerBatch);
    const country = input["country"];
    const searchLang = input["searchLang"];
    const uiLang = input["uiLang"];
    for (let batch = 0; batch < numBatches; batch++) {
        const numItems = Math.min(numTopicsPerBatch, topics.length - batch * numTopicsPerBatch);
        const braveSearchTasks = [];
        const deadline = DateTime.fromJSDate(context.df.currentUtcDateTime, {zone: 'utc'}).plus({seconds: 1});
        for (let item = 0; item < numItems; item++) {
            const braveSearchInput = {
                "q": topics[batch * numTopicsPerBatch + item],
                "country": country,
                "searchLang": searchLang,
                "uiLang": uiLang
            };
            braveSearchTasks.push(context.df.callActivity('SearchBraveActivity', braveSearchInput));
        }
        braveSearchTasks.push(context.df.createTimer(deadline.toJSDate()));
        const results: any[] = yield context.df.Task.all(braveSearchTasks);
        results.pop();
        newsOfTopics.push(...results);
    }

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
    const newsRelevance: any[] = yield context.df.Task.all(filterNewsTasks);

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

    const summarizeNewsTasks = [];
    for (let [topic, relevantNewsResults] of relevantNewsResultsByTopics) {
        const summarizeNewsInput = {topic: topic, relevantNewsResults: relevantNewsResults};
        summarizeNewsTasks.push(context.df.callActivity('SummarizeNewsActivity', summarizeNewsInput));
    }
    const newsSummaries: any[] = yield context.df.Task.all(summarizeNewsTasks);

    const time = context.df.currentUtcDateTime.toJSON();
    const cacheSummariesInput = {mkt: mkt, time: time, newsSummaries: newsSummaries};
    return yield context.df.callActivity('CacheSummariesActivity', cacheSummariesInput);
};

df.app.orchestration('RefreshOrchestrator', refresh);
