import { reviewQueue } from "../lib/queue";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function testReview() {
  console.log("🚀 Starting manual review test...");

  // 1. Get or create a user sync'd from Clerk (assume one exists if they visited home)
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log("ℹ️ Creating dummy user...");
    user = await prisma.user.create({
      data: {
        id: "user_test_123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });
  }

  // 2. Get or create a mock installation
  let installation = await prisma.installation.findFirst();
  if (!installation) {
    console.log("ℹ️ Creating dummy installation...");
    installation = await prisma.installation.create({
      data: {
        installationId: 12345678,
        accountLogin: "test-org",
        accountType: "Organization",
        userId: user.id,
      },
    });
  }

  // 3. Get or create a mock repo
  let repo = await prisma.repo.findFirst({
    where: { installationId: installation.id },
  });
  if (!repo) {
    console.log("ℹ️ Creating dummy repo...");
    repo = await prisma.repo.create({
      data: {
        repoId: 987654321,
        fullName: "test-org/test-repo",
        installationId: installation.id,
      },
    });
  }

  // 3. Create a dummy Review record
  const review = await prisma.review.create({
    data: {
      installationId: installation.id,
      repoId: repo.id,
      prNumber: 1,
      prTitle: "Manual Test Review",
      prAuthor: "tester",
      headSha: `mocksha_${Date.now()}`, // Unique SHA per run
      status: "PENDING",
      llmModel: "gemini-1.5-flash",
    },
  });

  // 4. Enqueue the job
  await reviewQueue.add("process-review", {
    reviewId: review.id,
    installationId: installation.installationId, // Use the actual GitHub installation ID
    owner: repo.fullName.split("/")[0],
    repo: repo.fullName.split("/")[1],
    prNumber: review.prNumber,
    headSha: review.headSha,
  });

  console.log(`✅ Success! Enqueued review job for PR #${review.prNumber}.`);
  console.log(`📡 Make sure your worker is running: npm run worker`);

  process.exit(0);
}

testReview().catch(console.error);
