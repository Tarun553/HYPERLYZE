import { getRepos } from "@/actions/repo";
import { RepoCard } from "@/components/dashboard/repo-card";
import { Github, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncFeedback } from "@/components/dashboard/sync-feedback";
import { redirect } from "next/navigation";

export default async function ReposPage({
  searchParams,
}: {
  searchParams: Promise<{ installation_id?: string; setup_action?: string }>;
}) {
  const params = await searchParams;
  if (params.installation_id) {
    redirect(
      `/api/github/callback?installation_id=${encodeURIComponent(params.installation_id)}`,
    );
  }

  const repos = await getRepos();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SyncFeedback />
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-cyber-blue mb-1">
          <Github className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest">
            Git Management
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-sans font-black tracking-tight text-white">
            CONNECTED <span className="text-cyber-blue">REPOS</span>
          </h1>
          <a
            href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-cyber-blue hover:bg-cyber-blue/80 text-white rounded-lg px-6 h-12 flex items-center space-x-2 shadow-[0_0_20px_rgba(46,91,255,0.3)] transition-all duration-300 hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5" />
              <span className="font-bold">Add Installation</span>
            </Button>
          </a>
        </div>
        <p className="text-muted-foreground text-sm max-w-xl">
          Toggle repositories to enable automated AI logic analysis on every
          Pull Request. Managed via high-performance Gemini 1.5 Flash.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
        {repos.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Github className="w-8 h-8 text-zinc-700" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold">No active repositories</h3>
              <p className="text-zinc-500 text-sm">
                Install the GitHub App to begin analyzing code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
