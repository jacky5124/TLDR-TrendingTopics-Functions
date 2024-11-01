import { getEnv } from './EnvGetter';

export const callBingSearchAPI = async (mkt: string): Promise<any> => {
    const apiKey = getEnv("BING_SEARCH_API_KEY");
    const url = `https://api.bing.microsoft.com/v7.0/news/trendingtopics?mkt=${mkt}`;
    const response = await fetch(url, {
        headers: {
            "Ocp-Apim-Subscription-Key": apiKey
        },
        method: 'GET'
    });
    if (response.ok) {
        return response.json();
    } else {
        throw new Error(`${response}`);
    }
};
