"use client";

import { useTransition } from "react";
import { toggleRepoActive } from "@/actions/repo";
import { Switch } from "@/components/ui/switch";
import { Shield, Clock, ExternalLink, ChevronRight, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Repo } from "@prisma/client";

export function RepoCard({ repo }: { repo: Repo }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        await toggleRepoActive(repo.id, checked);
        toast.success(
          `${checked ? "Enabled" : "Disabled"} analysis for ${repo.fullName}`,
        );
      } catch (error) {
        console.log(error);
        toast.error("Failed to update repository status");
      }
    });
  };

  return (
    <div
      className={cn(
        "group relative glass rounded-3xl p-6 transition-all duration-500 hover:border-cyber-blue/40",
        repo.isActive ? "bg-cyber-blue/5" : "bg-white/2",
      )}
    >
      {/* Decorative Glow */}
      <div
        className={cn(
          "absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10",
          repo.isActive ? "bg-cyber-blue/10" : "bg-white/5",
        )}
      />

      <div className="flex flex-col space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg",
                repo.isActive
                  ? "bg-cyber-blue text-white shadow-cyber-blue/20"
                  : "bg-white/5 text-zinc-500",
              )}
            >
              <Code2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-bold leading-tight group-hover:text-cyber-blue transition-colors">
                {repo.fullName.split("/")[1]}
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                {repo.fullName.split("/")[0]}
              </span>
            </div>
          </div>
          <Switch
            checked={repo.isActive}
            onCheckedChange={handleToggle}
            disabled={isPending}
            className="data-[state=checked]:bg-cyber-green"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <Shield className="w-3.5 h-3.5 text-cyber-blue" />
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">
              Security OK
            </span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <Clock className="w-3.5 h-3.5 text-cyber-green" />
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">
              Ready
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <a
            href={`https://github.com/${repo.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-[11px] text-zinc-500 hover:text-white transition-colors"
          >
            <span className="font-mono">source_view</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyber-blue/20 cursor-pointer transition-colors group/btn">
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover/btn:text-cyber-blue" />
          </div>
        </div>
      </div>
    </div>
  );
}
