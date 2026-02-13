import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Terminal,
  ShieldAlert,
  Info,
  AlertTriangle,
  Code2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: {
      repo: true,
      comments: true,
    },
  });

  if (!review) notFound();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/reviews"
          className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest">
            Back to Hub
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border",
              review.status === "COMPLETED"
                ? "bg-cyber-green/10 text-cyber-green border-cyber-green/20"
                : "bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20",
            )}
          >
            Status: {review.status}
          </span>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-3xl bg-cyber-blue flex items-center justify-center shadow-[0_0_30px_rgba(46,91,255,0.3)]">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-white leading-tight">
              {review.prTitle}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm font-mono text-cyber-blue">
                {review.repo.fullName}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span className="text-xs text-zinc-500">
                Analysis by {review.llmModel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Code2 className="w-6 h-6 text-cyber-blue" />
            <span>AI Insights & Feedback</span>
          </h3>

          <div className="space-y-6">
            {review.comments.map((comment) => (
              <div
                key={comment.id}
                className="glass rounded-3xl overflow-hidden border-white/5 group hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between px-6 py-4 bg-white/2 border-b border-white/5">
                  <div className="flex items-center space-x-3">
                    <SeverityIcon severity={comment.severity} />
                    <span className="text-xs font-mono font-bold text-white">
                      {comment.path}{" "}
                      <span className="text-zinc-500 ml-1">
                        : L{comment.line}
                      </span>
                    </span>
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                      severityClass(comment.severity),
                    )}
                  >
                    {comment.severity}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                    {comment.body}
                  </p>
                </div>
                <div className="px-6 py-3 bg-white/1 flex items-center space-x-4 mt-2 border-t border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-widest">
                    Apply Suggestion
                  </button>
                  <button className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-widest">
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}

            {review.comments.length === 0 && (
              <div className="py-20 glass rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-zinc-800 mb-4" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No issues detected in this diff
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/5 space-y-6 sticky top-8">
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                PR Meta
              </span>
              <div className="flex flex-col space-y-4 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600 font-mono uppercase">
                    Author
                  </span>
                  <span className="text-sm font-bold text-white">
                    {review.prAuthor}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600 font-mono uppercase">
                    Head SHA
                  </span>
                  <span className="text-xs font-mono text-cyber-blue truncate">
                    {review.headSha}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600 font-mono uppercase">
                    Created
                  </span>
                  <span className="text-sm font-bold text-white">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <Link
              href={`https://github.com/${review.repo.fullName}/pull/${review.prNumber}`}
              target="_blank"
              className="flex items-center justify-center space-x-2 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold text-sm"
            >
              <span>View PR on GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <ShieldAlert className="w-4 h-4 text-cyber-red" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    default:
      return <Info className="w-4 h-4 text-cyber-blue" />;
  }
}

function severityClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-cyber-red/10 text-cyber-red border border-cyber-red/20";
    case "warning":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    default:
      return "bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20";
  }
}
