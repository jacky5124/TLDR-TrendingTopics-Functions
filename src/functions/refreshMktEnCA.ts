import { app, InvocationContext, Timer } from "@azure/functions";

export async function refreshMktEnCA(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Timer function processed request.');
}

app.timer('refreshMktEnCA', {
    schedule: '0 0 8/6 * * *',
    handler: refreshMktEnCA
});
