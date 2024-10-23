import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';

const callBraveSearchAPI = async (q: string, country: string, searchLang: string, uiLang: string, apiKey: string): Promise<any> => {
    const query = `q=${q}&country=${country}&search_lang=${searchLang}&ui_lang=${uiLang}&count=5&freshness=pd&extra_snippets=1`;
    const url = `https://api.search.brave.com/res/v1/news/search?${query}`;
    const response = await fetch(url, {
        headers: {
            "X-Subscription-Token": apiKey
        },
        method: 'GET'
    });
    return response.json();
};

const searchBrave: ActivityHandler = async (input: any): Promise<any> => {
    const q: string = input["q"];
    const country: string = input["country"];
    const searchLang: string = input["searchLang"];
    const uiLang: string = input["uiLang"];
    const apiKey: string = input["apiKey"];
    const response = await callBraveSearchAPI(q, country, searchLang, uiLang, apiKey);
    const results: any[] = response["results"];
    const newsResults = results.map((result) => {
        return {
            "url": result["url"],
            "title": result["title"],
            "description": result["description"],
            "extra_snippets": result["extra_snippets"]
        };
    });
    return {"topic": q, "newsResults": newsResults};
}

df.app.activity('searchBraveActivity', { handler: searchBrave });