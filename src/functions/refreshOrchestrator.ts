import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';

const refresh: OrchestrationHandler = function* (context: OrchestrationContext) {
    const mkt = context.df.getInput<string>();
    return yield context.df.callActivity('searchBingActivity', mkt);
};

df.app.orchestration('refreshOrchestrator', refresh);
