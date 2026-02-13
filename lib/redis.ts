import Redis from "ioredis";

const REDIS_URL = "redis://default:yeD9ukrP4qedLYj1aePjw4bCUKw9dJ6N@redis-18479.c274.us-east-1-3.ec2.cloud.redislabs.com:18479";

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});
