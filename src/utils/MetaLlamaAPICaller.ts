import { getEnv } from './envGetter';
import ModelClient from "@azure-rest/ai-inference";
import { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export const generate = async (instruction: string, prompt: string): Promise<string> => {
    const client = ModelClient(
        getEnv("TLDR_LLAMA_API_ENDPOINT"), 
        new AzureKeyCredential(getEnv("TLDR_LLAMA_API_KEY"))
    );    

    const messages = [
        {role: "system", content: instruction},
        {role: "user", content: prompt}
    ];
    
    const response = await client.path("/chat/completions").post({
        body: {
            messages: messages
        }
    });

    if (isUnexpected(response)) {
        throw response.body.error;
    }

    return response.body.choices[0].message.content;
};