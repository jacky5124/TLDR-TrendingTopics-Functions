import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { callBingSearchAPI } from '../utils/BingSearchAPICaller';

const searchBing: ActivityHandler = async (input: any): Promise<string[]> => {
    const mkt: string = input['mkt'];
    const response = await callBingSearchAPI(mkt);
    const topics: any[] = response['value'];
    return topics.map((topic) => topic['query']['text']);
};

df.app.activity('searchBingActivity', { handler: searchBing });
