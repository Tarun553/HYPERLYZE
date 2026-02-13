import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { reviewQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const event = req.headers.get("x-github-event") ?? "";

  // Verify signature
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(body).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  try {
    // 1. Handle Installation events
    if (event === "installation") {
      if (payload.action === "created") {
        // Note: Actual Installation record is created in the callback route
        // to link with Clerk userId. Here we can just log or pre-cache.
        console.log(`Installation ${payload.installation.id} created`);
      }
      return new Response("OK", { status: 200 });
    }

    // 2. Handle Repository Sync
    if (event === "installation_repositories") {
      const { installation, repositories_added, repositories_removed } =
        payload;

      const dbInstallation = await prisma.installation.findUnique({
        where: { installationId: installation.id },
      });

      if (!dbInstallation)
        return new Response("Installation not found", { status: 200 });

      if (repositories_added) {
        for (const repo of repositories_added) {
          await prisma.repo.upsert({
            where: { repoId: repo.id },
            update: { fullName: repo.full_name, isActive: true },
            create: {
              repoId: repo.id,
              fullName: repo.full_name,
              installationId: dbInstallation.id,
            },
          });
        }
      }

      if (repositories_removed) {
        for (const repo of repositories_removed) {
          await prisma.repo.updateMany({
            where: { repoId: repo.id },
            data: { isActive: false },
          });
        }
      }

      return new Response("OK", { status: 200 });
    }

    // 2. Handle PR Events
    if (
      event === "pull_request" &&
      (payload.action === "opened" || payload.action === "synchronize")
    ) {
      const { pull_request, repository, installation } = payload;

      // Find or create repo in our DB
      const dbRepo = await prisma.repo.upsert({
        where: { repoId: repository.id },
        update: { fullName: repository.full_name, isActive: true },
        create: {
          repoId: repository.id,
          fullName: repository.full_name,
          installation: {
            connect: { installationId: installation.id },
          },
        },
      });

      if (!dbRepo.isActive)
        return new Response("Repo inactive", { status: 200 });

      // Create Review record
      const review = await prisma.review.create({
        data: {
          installationId:
            (
              await prisma.installation.findUnique({
                where: { installationId: installation.id },
              })
            )?.id || "",
          repoId: dbRepo.id,
          prNumber: pull_request.number,
          prTitle: pull_request.title,
          prAuthor: pull_request.user.login,
          headSha: pull_request.head.sha,
          status: "PENDING",
          llmModel: "gemini-1.5-flash",
        },
      });

      // Enqueue for processing
      await reviewQueue.add("process-review", {
        reviewId: review.id,
        installationId: installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        prNumber: pull_request.number,
        headSha: pull_request.head.sha,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
