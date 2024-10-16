import * as df from 'durable-functions';
import { ActivityHandler } from 'durable-functions';

const hello: ActivityHandler = (input: string): string => {
    return `Hello, ${input}`;
};

df.app.activity('hello', { handler: hello });
