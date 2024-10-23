import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';
import { DateTime } from "luxon";

const refresh: OrchestrationHandler = function* (context: OrchestrationContext) {
    const input = context.df.getInput<string>();

    const bingSearchInput = {"mkt": input['mkt']};
    const topics: string[] = yield context.df.callActivity('searchBingActivity', bingSearchInput);

    const newsOfTopics = [];
    const numTopicsPerPage = 5;
    const numPages = Math.ceil(topics.length / numTopicsPerPage);
    const country = input["country"];
    const searchLang = input["searchLang"];
    const uiLang = input["uiLang"];
    for (let page = 0; page < numPages; page++) {
        const numItems = Math.min(numTopicsPerPage, topics.length - page * numTopicsPerPage);
        const braveSearchTasks = [];
        const deadline = DateTime.fromJSDate(context.df.currentUtcDateTime, {zone: 'utc'}).plus({seconds: 1});
        for (let item = 0; item < numItems; item++) {
            const braveSearchInput = {
                "q": topics[page * numTopicsPerPage + item],
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

    return newsOfTopics;
};

df.app.orchestration('refreshOrchestrator', refresh);
