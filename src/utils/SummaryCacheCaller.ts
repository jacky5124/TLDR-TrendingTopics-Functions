import { Configuration, ConfidentialClientApplication, ClientCredentialRequest } from '@azure/msal-node';
import { getEnv } from './EnvGetter';

const getAccessToken = async (): Promise<string> => {
    const msalConfig: Configuration = {
        auth: {
            clientId: getEnv("FUNCTIONS_CLIENT_ID"),
            clientSecret: getEnv("FUNCTIONS_CLIENT_SECRET"),
            authority: `https://login.microsoftonline.com/${getEnv("TENANT_ID")}`
        }
    };
    const cca = new ConfidentialClientApplication(msalConfig);
    const tokenRequest: ClientCredentialRequest = {
        scopes: [getEnv("CACHE_ACCESS_SCOPE")]
    };
    const response = await cca.acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;
};

const putTopicSummaries = async (result: Result, accessToken: string): Promise<any> => {
    const url = `${getEnv("CACHE_ENDPOINT")}?mkt=${result.mkt}`;
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        method: 'PUT',
        body: JSON.stringify(result)
    });
    if (response.ok) {
        return response.text();
    } else {
        throw new Error(`status: ${response.status}, statusText: ${response.statusText}`);
    }
};

export const cacheTopicSummaries = async (result: Result): Promise<any> => {
    const accessToken = await getAccessToken();
    return putTopicSummaries(result, accessToken);
};

export type News = {
    title: string,
    url: string
};

export type Topic = {
    topic: string,
    summary: string,
    news: News[]
};

export type Result = {
    mkt: string,
    time: string,
    topics: Topic[]
};
