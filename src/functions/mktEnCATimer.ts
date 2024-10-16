import { app, InvocationContext, Timer } from "@azure/functions";
import * as df from 'durable-functions';

export async function refreshMktEnCA(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Started saying hello to Canadian cities.');
    const client = df.getClient(context);
    const instanceId = await client.startNew('helloOrchestrator', {input: 'en-CA'});
    context.log(`Started orchestration with ID = '${instanceId}'.`);
    context.log(client.createHttpManagementPayload(instanceId));
}

app.timer('refreshMktEnCA', {
    schedule: '0 0 8/6 * * *',
    extraInputs: [df.input.durableClient()],
    handler: refreshMktEnCA
});
