import { Queue } from "bullmq";
import { connection } from "./redis";

export const reviewQueue = new Queue("review-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});
