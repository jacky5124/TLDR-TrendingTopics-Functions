import { getEnv } from './EnvGetter';

export const callBraveSearchAPI = async (q: string, country: string, searchLang: string, uiLang: string): Promise<any> => {
    const apiKey = getEnv("BRAVE_SEARCH_API_KEY");
    const query = `q=${q}&country=${country}&search_lang=${searchLang}&ui_lang=${uiLang}&count=5&freshness=pd&extra_snippets=1`;
    const url = `https://api.search.brave.com/res/v1/news/search?${query}`;
    const response = await fetch(url, {
        headers: {
            "X-Subscription-Token": apiKey
        },
        method: 'GET'
    });
    if (response.ok) {
        return response.json();
    } else {
        throw new Error(`${response}`);
    }
};
