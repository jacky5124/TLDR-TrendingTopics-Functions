## Introduction

This is the repository of the scheduled jobs of [TLDR: Trending Topics](https://huggingface.co/spaces/jacky5124/TLDR-TrendingTopics), 
an AI with grounding that summarizes relevant news of trending topics. The scheduled jobs are implemented as 
timer-triggered Azure Functions, which call Azure Durable Functions that orchestrate the complete workflow from 
fetching trending topics to generating summaries. Durable Functions not only allow strategic retries in case 
of partial failures, but also support fan-out/fan-in pattern to parallelize API calls. Since Azure Functions are 
serverless by nature, computing resources will only be consumed when the jobs are actually running, which can greatly 
reduce cost because the jobs are scheduled to run once per six hours and each job takes just one minute to run.

## Related Repositories

- [Hugging Face repository of the frontend](https://huggingface.co/spaces/jacky5124/TLDR-TrendingTopics/tree/main)
- [GitHub repository of the cache service](https://github.com/jacky5124/TLDR-TrendingTopics-Cache)

## Function Definition

- Timer-triggered Functions
    1. `RefreshMktEnCATimer` is a Function that starts the Orchestrator Function for en-US every 6 hours.
    2. `RefreshMktEnUSTimer` is a Function that starts the Orchestrator Function for en-CA every 6 hours.
- Durable Functions
    1. `RefreshOrchestrator` is an Orchestrator Function which follows the fan-out/fan-in pattern to complete 
    the entire workflow of summarizing trending topics in a specific `mkt`, which can be `en-CA` for Canada or 
    `en-US` for United States.
    2. `SearchBingActivity` is an Activity Function which searches trending topics in a specific `mkt` using Bing Search API.
    3. `SearchBraveActivity` is an Activity Function which searches top 5 news articles of a specific trending topic using Brave Search API.
    4. `FilterNewsActivity` is an Activity Function which checks relevance between a news article and a trending topic using Meta Llama 3.1 8B Instruct.
    5. `SummarizeNewsActivity` is an Activity Function which summarizes top 5 relevant news of a specific trending topic using Meta Llama 3.1 8B Instruct.
    6. `CacheSummariesActivity` is an Activity Function which caches the summarizations by calling the PUT API of the cache service.

## Function Execution

1. `RefreshMktEnCATimer` or `RefreshMktEnUSTimer` is triggered by the timer and calls `RefreshOrchestrator` to orchestrate the entire workflow.
2. `SearchBingActivity` is called to get a list of trending topics from Bing News Search API.
3. For each trending topic:
    1. `SearchBraveActivity` is called to search it by using Brave News Search API to get the top 5 results.
    2. For each news article in the top 5 results:
        1. `FilterNewsActivity` is called to determine whether the news article is relevant to the topic by using Meta Llama 3.1 8B Instruct.
        2. Remove the news article from the results if it is not relevant to the topic.
    3. `SummarizeNewsActivity` is called to summarize the remaining news by using Meta Llama 3.1 8B Instruct.
4. `CacheSummariesActivity` is called to cache all the results by calling the PUT API of the cache service.
