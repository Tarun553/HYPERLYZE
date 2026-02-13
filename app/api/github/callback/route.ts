import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getInstallationOctokit } from "@/lib/github";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");

  if (!installationId) {
    return redirect("/dashboard/repos");
  }

  try {
    const octokit = await getInstallationOctokit(parseInt(installationId));

    // Fetch installation details
    const { data: installation } = await octokit.rest.apps.getInstallation({
      installation_id: parseInt(installationId),
    });

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

    // Fetch and sync repositories
    const {
      data: { repositories },
    } = await octokit.rest.apps.listReposAccessibleToInstallation();

    for (const repo of repositories) {
      await prisma.repo.upsert({
        where: { repoId: repo.id },
        update: {
          fullName: repo.full_name,
        },
        create: {
          repoId: repo.id,
          fullName: repo.full_name,
          installationId: dbInstallation.id,
        },
      });
    }

    return redirect("/dashboard/repos?success=true");
  } catch (error) {
    console.error("Error in GitHub callback:", error);
    return redirect("/dashboard/repos?error=sync_failed");
  }
}
