import { getRecentReviews } from "@/actions/repo";
import {
  History,
  Search,
  Filter,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ReviewsPage() {
  const reviews = await getRecentReviews();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-cyber-blue mb-1">
          <History className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest">
            Analysis Feed
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-sans font-black tracking-tight text-white uppercase">
            REVIEW <span className="text-cyber-blue">HUB</span>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyber-blue transition-colors" />
              <input
                type="text"
                placeholder="Find analysis..."
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyber-blue/50 w-64 transition-all"
              />
            </div>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
        {reviews.length === 0 && (
          <div className="py-32 glass rounded-3xl border-white/5 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <History className="w-8 h-8 text-zinc-700" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold">Waiting for input</h3>
              <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
                System idle. No PRs detected.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ review }: any) {
  return (
    <Link
      href={`/dashboard/reviews/${review.id}`}
      className="block glass rounded-2xl border-white/5 hover:border-cyber-blue/30 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-6">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
              statusColor(review.status),
            )}
          >
            <ZapIcon status={review.status} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-lg font-bold text-white group-hover:text-cyber-blue transition-colors">
                {review.prTitle}
              </span>
              <span className="text-[10px] bg-white/5 text-zinc-400 font-mono px-2 py-0.5 rounded border border-white/5">
                #{review.prNumber}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-zinc-500 flex items-center space-x-1">
                <span className="font-mono text-cyber-blue">
                  {review.repo.fullName}
                </span>
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span className="text-[10px] text-zinc-600 font-mono uppercase">
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter mb-1">
              Engine
            </span>
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-tight">
              {review.llmModel.split("-")[1]}
            </span>
          </div>

          <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-cyber-blue group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Decorative Progress Line if processing */}
      {review.status === "PROCESSING" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-blue overflow-hidden">
          <div className="h-full bg-white/50 animate-progress w-1/2" />
        </div>
      )}
    </Link>
  );
}

function ZapIcon({ status }: { status: string }) {
  if (status === "COMPLETED")
    return <History className="w-6 h-6 text-cyber-green" />;
  if (status === "PROCESSING")
    return <Zap className="w-6 h-6 text-cyber-blue animate-pulse" />;
  return <History className="w-6 h-6 text-cyber-red" />;
}

function Zap({ className }: any) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-cyber-green/10 text-cyber-green border border-cyber-green/20";
    case "PROCESSING":
      return "bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20";
    default:
      return "bg-cyber-red/10 text-cyber-red border border-cyber-red/20";
  }
}
