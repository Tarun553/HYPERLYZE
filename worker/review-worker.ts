import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { fetchPRDiff, postReviewComments } from "@/lib/github";
import { generateReview } from "@/lib/gemini";

console.log("Worker starting...");

interface AIReviewComment {
  path: string;
  line: number;
  body: string;
  severity: string;
}

const worker = new Worker(
  "review-queue",
  async (job) => {
    const { reviewId, installationId, owner, repo, prNumber } = job.data;

    try {
      console.log(`Processing review ${reviewId} for PR #${prNumber}`);

      // 1. Update status to PROCESSING
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: "PROCESSING" },
      });

      // 2. Fetch Diff
      const diff = await fetchPRDiff(installationId, owner, repo, prNumber);

      // 3. Generate Review
      const reviewComments: AIReviewComment[] = await generateReview(diff);

      if (reviewComments && reviewComments.length > 0) {
        // 4. Post to GitHub
        await postReviewComments(
          installationId,
          owner,
          repo,
          prNumber,
          reviewComments,
        );

        // 5. Save comments to DB
        await prisma.reviewComment.createMany({
          data: reviewComments.map((c) => ({
            reviewId,
            path: c.path,
            line: c.line,
            body: c.body,
            severity: c.severity,
          })),
        });
      }

      // 6. Update status to COMPLETED
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: "COMPLETED" },
      });

      console.log(`Review ${reviewId} completed successfully`);
    } catch (error) {
      console.error(`Review ${reviewId} failed:`, error);

      await prisma.review.update({
        where: { id: reviewId },
        data: { status: "FAILED" },
      });

      throw error; // Re-throw to allow BullMQ retries
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { connection: connection as any },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
