import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';
import { DateTime } from "luxon";

const refresh: OrchestrationHandler = function* (context: OrchestrationContext) {
    const input = context.df.getInput<string>();

    const bingSearchInput = {"mkt": input['mkt']};
    const topics: string[] = yield context.df.callActivity('searchBingActivity', bingSearchInput);

    const newsOfTopics = [];
    const numTopicsPerBatch = 5;
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
            braveSearchTasks.push(context.df.callActivity('searchBraveActivity', braveSearchInput));
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
            const filterNewsInput = {topic: topic, news: JSON.stringify(newsResult, null, 4)};
            filterNewsTasks.push(context.df.callActivity('filterNewsActivity', filterNewsInput));
        }
    }
    const newsRelevance: any[] = yield context.df.Task.all(filterNewsTasks);

    return newsRelevance;
};

df.app.orchestration('refreshOrchestrator', refresh);
