import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { callBraveSearchAPI } from '../utils/BraveSearchAPICaller';

const searchBrave: ActivityHandler = async (input: any): Promise<any> => {
    const q: string = input["q"];
    const country: string = input["country"];
    const searchLang: string = input["searchLang"];
    const uiLang: string = input["uiLang"];
    const response = await callBraveSearchAPI(q, country, searchLang, uiLang);
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

df.app.activity('SearchBraveActivity', { handler: searchBrave });
