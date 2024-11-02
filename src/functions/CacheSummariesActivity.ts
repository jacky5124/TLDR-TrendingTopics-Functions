import { InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { cacheTopicSummaries, News, Topic, Result } from '../utils/SummaryCacheCaller';

const cacheSummaries: ActivityHandler = async (input: any, context: InvocationContext): Promise<any> => {
    const mkt: string = input["mkt"];
    const time: string = input["time"];
    const newsSummaries: any[] = input["newsSummaries"];

    const result: Result = {
        mkt: mkt,
        time: time,
        topics: newsSummaries.map((newsSummary) => {
            const topic: string = newsSummary["topic"];
            const summary: string = newsSummary["summary"];
            const relevantNewsResults: any[] = newsSummary["relevantNewsResults"];
            const topicResult: Topic = {
                topic: topic,
                summary: summary,
                news: relevantNewsResults.map((relevantNewsResult) => {
                    const title: string = relevantNewsResult["title"];
                    const url: string = relevantNewsResult["url"];
                    const newsResult: News = {
                        title: title, 
                        url: url
                    };
                    return newsResult;
                })
            };
            return topicResult;
        })
    };

    return await cacheTopicSummaries(result);
};

df.app.activity('CacheSummariesActivity', { handler: cacheSummaries });
