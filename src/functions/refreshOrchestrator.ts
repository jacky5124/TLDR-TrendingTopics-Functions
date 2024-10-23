import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';

const refresh: OrchestrationHandler = function* (context: OrchestrationContext) {
    const mkt = context.df.getInput<string>();
    const secrets = yield context.df.callActivity('getSecretsActivity');
    const bingSearchInput = {"mkt": mkt, "apiKey": secrets["bingSearchSecret"]};
    return yield context.df.callActivity('searchBingActivity', bingSearchInput);
};

df.app.orchestration('refreshOrchestrator', refresh);
