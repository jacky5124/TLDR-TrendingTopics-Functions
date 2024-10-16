import { app, InvocationContext, Timer } from "@azure/functions";
import * as df from 'durable-functions';

export async function refreshMktEnUS(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Started saying hello to American cities.');
    const client = df.getClient(context);
    const instanceId = await client.startNew('helloOrchestrator', {input: 'en-US'});
    context.log(`Started orchestration with ID = '${instanceId}'.`);
    context.log(client.createHttpManagementPayload(instanceId));
}

app.timer('refreshMktEnUS', {
    schedule: '0 0 8/6 * * *',
    extraInputs: [df.input.durableClient()],
    handler: refreshMktEnUS
});
