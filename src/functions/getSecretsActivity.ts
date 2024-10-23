import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';
import { SecretClient, KeyVaultSecret, SecretProperties } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const getEnv = (envName: string): string => {
    const envVal = process.env[envName];
    if (!envVal) throw new Error(`${envName} is empty`);
    return envVal;
};

const getSecrets: ActivityHandler = async (): Promise<any> => {
    // Passwordless credential
    const credential = new DefaultAzureCredential();

    const keyVaultUrl = getEnv('KEY_VAULT_URL');
    const bingSearchSecretName = getEnv('BING_SEARCH_SECRET_NAME');
    const braveSearchSecretName = getEnv('BRAVE_SEARCH_SECRET_NAME');
    const tldrLlamaSecretName = getEnv('TLDR_LLAMA_SECRET_NAME');
    const tldrFunctionsClientIdName = getEnv('TLDR_FUNCTIONS_CLIENT_ID_NAME');
    const tldrFunctionsClientSecretName = getEnv('TLDR_FUNCTIONS_CLIENT_SECRET_NAME');

    const secretClient = new SecretClient(keyVaultUrl, credential);
    const bingSearchSecretPromise = secretClient.getSecret(bingSearchSecretName);
    const braveSearchSecretPromise = secretClient.getSecret(braveSearchSecretName);
    const tldrLlamaSecretPromise = secretClient.getSecret(tldrLlamaSecretName);
    const tldrFunctionsClientIdPromise = secretClient.getSecret(tldrFunctionsClientIdName);
    const tldrFunctionsClientSecretPromise = secretClient.getSecret(tldrFunctionsClientSecretName);

    const secrets = await Promise.all([
        bingSearchSecretPromise,
        braveSearchSecretPromise,
        tldrLlamaSecretPromise,
        tldrFunctionsClientIdPromise,
        tldrFunctionsClientSecretPromise
    ]);

    return {
        "bingSearchSecret": secrets[0].value,
        "braveSearchSecret": secrets[1].value,
        "tldrLlamaSecret": secrets[2].value,
        "tldrFunctionsClientId": secrets[3].value,
        "tldrFunctionsClientSecret": secrets[4].value
    };
};

df.app.activity('getSecretsActivity', { handler: getSecrets });
