import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';

const callBingSearchAPI = async (mkt: string, apiKey: string): Promise<any> => {
    const url = `https://api.bing.microsoft.com/v7.0/news/trendingtopics?mkt=${mkt}`;
    const response = await fetch(url, {
        headers: {
            "Ocp-Apim-Subscription-Key": apiKey
        },
        method: 'GET'
    });
    return response.json();
};

const searchBing: ActivityHandler = async (input: any): Promise<string[]> => {
    const mkt: string = input['mkt'];
    const apiKey: string = input['apiKey'];
    const response = await callBingSearchAPI(mkt, apiKey);
    const topics: any[] = response['value'];
    return topics.map((topic) => topic['query']['text']);
};

df.app.activity('searchBingActivity', { handler: searchBing });
