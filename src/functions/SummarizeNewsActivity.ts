import { InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { readFile } from '../utils/FileReader';
import { formatString } from '../utils/StringFormatter';
import { generate } from '../utils/MetaLlamaAPICaller';

const summarizeNews: ActivityHandler = async (input: any, context: InvocationContext): Promise<any> => {
    const topic = input["topic"];
    const relevantNewsResults = input["relevantNewsResults"];

    const summaryInstruction = readFile("dist/src/templates/summary_instruction.txt");
    const summaryPromptTemplate = readFile("dist/src/templates/summary_prompt.txt");

    const relevantNewsResultsJSON = JSON.stringify(relevantNewsResults, null, 4);
    const summaryPrompt = formatString(summaryPromptTemplate, {topic: topic, news: relevantNewsResultsJSON});

    const summaryContent = await generate(summaryInstruction, summaryPrompt);

    return {topic: topic, relevantNewsResults: relevantNewsResults, summary: summaryContent};
};

df.app.activity('SummarizeNewsActivity', { handler: summarizeNews });
