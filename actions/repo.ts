"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getRepos() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await prisma.repo.findMany({
    where: {
      installation: {
        userId: userId,
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });
}

export async function toggleRepoActive(repoId: string, isActive: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership before updating
  const repo = await prisma.repo.findFirst({
    where: {
      id: repoId,
      installation: {
        userId: userId,
      },
    },
  });

  if (!repo) throw new Error("Repository not found or unauthorized");

  await prisma.repo.update({
    where: { id: repoId },
    data: { isActive },
  });

  revalidatePath("/dashboard/repos");
}

export async function getRecentReviews() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await prisma.review.findMany({
    where: {
      installation: {
        userId: userId,
      },
    },
    include: {
      repo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}
