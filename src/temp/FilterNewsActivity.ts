import { InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { readFile } from '../utils/FileReader';
import { formatString } from '../utils/StringFormatter';
import { generate } from '../utils/MetaLlamaAPICaller';

const filterNews: ActivityHandler = async (input: any, context: InvocationContext): Promise<any> => {
    const topic = input["topic"];
    const newsResult = input["newsResult"];

    const filterInstruction = readFile("dist/src/templates/filter_instruction.txt");
    const filterPromptTemplate = readFile("dist/src/templates/filter_prompt.txt");

    const newsResultJSON = JSON.stringify(newsResult, null, 4);
    const filterPrompt = formatString(filterPromptTemplate, {topic: topic, news: newsResultJSON});

    const filterContent = await generate(filterInstruction, filterPrompt);

    let filterResult: boolean;
    if (filterContent.toLocaleLowerCase().includes("true")) {
        filterResult = true;
    } else if (filterContent.toLocaleLowerCase().includes("false")) {
        filterResult = false;
    } else {
        filterResult = undefined;
    }

    return {topic: topic, newsResult: newsResult, relevant: filterResult};
};

df.app.activity('FilterNewsActivity', { handler: filterNews });
