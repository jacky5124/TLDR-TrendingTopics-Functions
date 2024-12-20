import { app, InvocationContext, Timer } from "@azure/functions";
import * as df from 'durable-functions';
import { getEnv } from '../utils/EnvGetter';

export async function refreshMktEnCA(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Started refreshing summary of trending topics in mkt en-CA.');
    const client = df.getClient(context);
    const input = {"mkt": "en-CA", "country": "ca", "searchLang": "en", "uiLang": "en-CA", "BraveAPIRate": 5};
    const instanceId = await client.startNew('RefreshOrchestrator', {input: input});
    context.log(`Started orchestration with ID '${instanceId}'.`);
    context.log(client.createHttpManagementPayload(instanceId));
}

app.timer('RefreshMktEnCATimer', {
    schedule: getEnv("EN_CA_TIMER"),
    extraInputs: [df.input.durableClient()],
    handler: refreshMktEnCA
});
