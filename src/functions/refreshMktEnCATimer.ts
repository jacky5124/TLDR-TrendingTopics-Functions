import { app, InvocationContext, Timer } from "@azure/functions";
import * as df from 'durable-functions';

export async function refreshMktEnCA(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Started refreshing summary of trending topics in mkt en-CA.');
    const client = df.getClient(context);
    const input = {"mkt": "en-CA", "country": "ca", "searchLang": "en", "uiLang": "en-CA"};
    const instanceId = await client.startNew('refreshOrchestrator', {input: input});
    context.log(`Started orchestration with ID = '${instanceId}'.`);
    context.log(client.createHttpManagementPayload(instanceId));
}

app.timer('refreshMktEnCATimer', {
    schedule: '0 0 8/6 * * *',
    extraInputs: [df.input.durableClient()],
    handler: refreshMktEnCA
});
