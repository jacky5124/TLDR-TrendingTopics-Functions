import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { SecretClient, KeyVaultSecret, SecretProperties } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const getBingSearchAPIKey = async (): Promise<string> => {
    // Passwordless credential
    const credential = new DefaultAzureCredential();

    const keyVaultUrl = process.env['KEY_VAULT_URL'];
    if (!keyVaultUrl) throw new Error("KEY_VAULT_URL is empty");
    const bingSearchSecretName = process.env['BING_SEARCH_SECRET_NAME'];
    if (!bingSearchSecretName) throw new Error('BING_SEARCH_SECRET_NAME is empty');

    const secretClient = new SecretClient(keyVaultUrl, credential);
    const secret = await secretClient.getSecret(bingSearchSecretName);
    return secret.value;
};

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

const searchBing: ActivityHandler = async (mkt: string): Promise<string[]> => {
    const apiKey = await getBingSearchAPIKey();
    const trendingTopics = await callBingSearchAPI(mkt, apiKey);
    const topics = [];
    for (let trendingTopic of trendingTopics['value']) {
        const topic = trendingTopic['query']['text'];
        topics.push(topic);
    }
    return topics;
};

df.app.activity('searchBingActivity', { handler: searchBing });
