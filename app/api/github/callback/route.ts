import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getInstallationOctokit } from "@/lib/github";
import { syncUser } from "@/lib/syncUser";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");

  console.log(
    `📡 GitHub Callback Received: userId=${userId}, installationId=${installationId}`,
  );

  if (!installationId) {
    return NextResponse.redirect(new URL("/dashboard/repos", req.url));
  }

  try {
    const parsedInstallationId = Number(installationId);
    if (!Number.isInteger(parsedInstallationId)) {
      return NextResponse.redirect(new URL("/dashboard/repos?error=sync_failed", req.url));
    }

    // Ensure user row exists before creating Installation (FK: Installation.userId -> User.id)
    await syncUser();

    const octokit = await getInstallationOctokit(parsedInstallationId);
    console.log(`🔑 Octokit initialized for installation ${installationId}`);

    // Fetch installation details
    const { data: installation } = await octokit.rest.apps.getInstallation({
      installation_id: parsedInstallationId,
    });
    console.log(
      `📋 GitHub Installation Data: ${JSON.stringify(installation.account)}`,
    );

    // Save or update installation
    const dbInstallation = await prisma.installation.upsert({
      where: { installationId: installation.id },
      update: { userId },
      create: {
        installationId: installation.id,
        userId,
        accountLogin:
          (installation.account as { login: string }).login || "unknown",
        accountType: (installation.account as { type: string }).type || "User",
      },
    });
    console.log(
      `✅ DB Installation Record: ${dbInstallation.id} (Linked to User: ${userId})`,
    );

    const {
      data: { repositories },
    } = await octokit.rest.apps.listReposAccessibleToInstallation();

    console.log(
      `📦 Found ${repositories.length} repositories for installation ${installationId}`,
    );

    for (const repo of repositories) {
      await prisma.repo.upsert({
        where: { repoId: repo.id },
        update: {
          fullName: repo.full_name,
          installationId: dbInstallation.id,
          isActive: true,
        },
        create: {
          repoId: repo.id,
          fullName: repo.full_name,
          installationId: dbInstallation.id,
        },
      });
    }

    return NextResponse.redirect(new URL("/dashboard/repos?success=true", req.url));
  } catch (error) {
    console.error("Error in GitHub callback:", error);
    return NextResponse.redirect(new URL("/dashboard/repos?error=sync_failed", req.url));
  }
}
