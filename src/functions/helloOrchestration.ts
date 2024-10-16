import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';

const activityName = 'hello';

const helloOrchestrator: OrchestrationHandler = function* (context: OrchestrationContext) {
    const outputs = [];
    const mkt = context.df.getInput<string>();
    if (mkt === 'en-US') {
        outputs.push(yield context.df.callActivity(activityName, 'Seattle'));
        outputs.push(yield context.df.callActivity(activityName, 'San Francisco'));
        outputs.push(yield context.df.callActivity(activityName, 'Los Angeles'));
    } else if (mkt === 'en-CA') {
        outputs.push(yield context.df.callActivity(activityName, 'Vancouver'));
        outputs.push(yield context.df.callActivity(activityName, 'Toronto'));
        outputs.push(yield context.df.callActivity(activityName, 'Ottawa'));
    }
    return outputs;
};

df.app.orchestration('helloOrchestrator', helloOrchestrator);
