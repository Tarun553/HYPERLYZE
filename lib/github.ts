import { App } from "octokit";

let githubApp: App | null = null;

export function getGitHubApp() {
  if (!githubApp) {
    const privateKey =
      process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_PRIVATE_KEY;

    if (!process.env.GITHUB_APP_ID || !privateKey) {
      throw new Error(
        "GitHub App credentials are not set (GITHUB_APP_ID or GITHUB_PRIVATE_KEY)",
      );
    }

    console.log("🔑 Initializing GitHub App...");
    console.log(`- App ID: ${process.env.GITHUB_APP_ID}`);
    let finalKey = privateKey.trim();

    // If it's base64-encoded PEM or raw base64, decode it
    if (!finalKey.includes("BEGIN")) {
      try {
        const decoded = Buffer.from(
          finalKey.replace(/\s/g, ""),
          "base64",
        ).toString("utf-8");
        if (decoded.includes("BEGIN")) {
          finalKey = decoded;
        } else {
          // If decoding didn't give a PEM, it might be the raw base64 body of a PEM
          // Re-wrap it in headers as Octokit expects PEM format
          finalKey = `-----BEGIN RSA PRIVATE KEY-----\n${finalKey.replace(/\s/g, "\n")}\n-----END RSA PRIVATE KEY-----`;
        }
      } catch (e) {
        console.error("❌ Failed to decode private key as base64", e);
      }
    }

    console.log(`- Final Key Length: ${finalKey.length}`);
    console.log(`- Key starts with: ${finalKey.substring(0, 30)}...`);

    githubApp = new App({
      appId: process.env.GITHUB_APP_ID,
      privateKey: finalKey,
    });
  }
  return githubApp;
}

export async function getInstallationOctokit(installationId: number) {
  const app = getGitHubApp();
  return await app.getInstallationOctokit(installationId);
}

export async function fetchPRDiff(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number,
) {
  const octokit = await getInstallationOctokit(installationId);
  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });
  return diff as unknown as string;
}

export async function postReviewComments(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number,
  comments: Array<{ path: string; line: number; body: string }>,
) {
  const octokit = await getInstallationOctokit(installationId);

  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    event: "COMMENT",
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: c.body,
    })),
  });
}
