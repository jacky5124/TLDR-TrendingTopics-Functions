import { app, InvocationContext, Timer } from "@azure/functions";
import * as df from 'durable-functions';

export async function refreshMktEnUS(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Started refreshing summary of trending topics in mkt en-US.');
    const client = df.getClient(context);
    const input = {"mkt": "en-US", "country": "us", "searchLang": "en", "uiLang": "en-US", "BraveAPIRate": 5};
    const instanceId = await client.startNew('RefreshOrchestrator', {input: input});
    context.log(`Started orchestration with ID '${instanceId}'.`);
    context.log(client.createHttpManagementPayload(instanceId));
}

app.timer('RefreshMktEnUSTimer', {
    schedule: '0 0 8/6 * * *',
    extraInputs: [df.input.durableClient()],
    handler: refreshMktEnUS
});
