import { InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { readFile } from '../utils/fileReader';
import { formatString } from '../utils/stringFormatter';
import { generate } from '../utils/MetaLlamaAPICaller';

const filterNews: ActivityHandler = async (input: any, context: InvocationContext): Promise<any> => {
    const topic = input["topic"];
    const news = input["news"];

    const filterInstruction = readFile("dist/src/templates/filter_instruction.txt");
    const filterPromptTemplate = readFile("dist/src/templates/filter_prompt.txt");

    const filterPrompt = formatString(filterPromptTemplate, {topic: topic, news: news});

    const filterContent = await generate(filterInstruction, filterPrompt);

    let filterResult: boolean;
    if (filterContent.toLocaleLowerCase().includes("true")) {
        filterResult = true;
    } else if (filterContent.toLocaleLowerCase().includes("false")) {
        filterResult = false;
    } else {
        filterResult = undefined;
    }

    return {topic: topic, news: news, relevant: filterResult};
};

df.app.activity('filterNewsActivity', { handler: filterNews });