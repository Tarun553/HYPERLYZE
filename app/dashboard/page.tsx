import { getRecentReviews, getRepos } from "@/actions/repo";
import { LayoutDashboard, History, Zap, Activity } from "lucide-react";

export default async function DashboardOverview() {
  const [reviews, repos] = await Promise.all([getRecentReviews(), getRepos()]);

  const activeRepos = repos.filter((r) => r.isActive).length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-cyber-blue mb-1">
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest">
            Global Overview
          </span>
        </div>
        <h1 className="text-4xl font-sans font-black tracking-tight text-white uppercase">
          Command <span className="text-cyber-blue">Center</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Reviews"
          value={reviews.length.toString()}
          sub="Last 30 days"
          icon={History}
          trend="+12%"
        />
        <StatCard
          label="Active Repos"
          value={activeRepos.toString()}
          sub={`${repos.length - activeRepos} latent`}
          icon={Zap}
          trend="+2"
          color="blue"
        />
        <StatCard
          label="Avg Score"
          value="92"
          sub="Engine Reliability"
          icon={Activity}
          trend="+5.4"
          color="green"
        />
        <StatCard
          label="Latency"
          value="1.2s"
          sub="Flash Inference"
          icon={Zap}
          trend="-200ms"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyber-blue" />
            <span>Recent Activity Stream</span>
          </h3>
          <div className="glass rounded-3xl p-1 overflow-hidden border-white/5">
            {reviews.length > 0 ? (
              <div className="divide-y divide-white/5">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-6 hover:bg-white/2 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-cyber-blue transition-colors">
                        <History className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-cyber-blue transition-colors">
                          {review.prTitle}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {review.repo.fullName} #{review.prNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={StatClassName(review.status)}>
                          {review.status}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">
                          Status
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">
                  No stream activity detected
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">System Health</h3>
          <div className="glass rounded-3xl p-6 border-white/5 space-y-6">
            <HealthItem label="Gemini Flash 1.5" score={99} />
            <HealthItem label="BullMQ Worker" score={100} />
            <HealthItem label="Prisma Node" score={98} />
            <HealthItem label="Redis Sync" score={100} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  trend: string;
  icon: React.ElementType;
  color?: string;
}

function StatCard({ label, value, sub, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="glass rounded-3xl p-6 border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 group-hover:text-cyber-blue transition-colors">
          {label}
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black text-white">{value}</span>
          <span className="text-[10px] font-mono text-cyber-green">
            {trend}
          </span>
        </div>
        <span className="text-[10px] text-zinc-600">{sub}</span>
      </div>
      <Icon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/2 group-hover:text-cyber-blue/3 transition-colors" />
    </div>
  );
}

function HealthItem({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-zinc-400">
          {label}
        </span>
        <span className="text-[10px] font-mono font-bold text-cyber-green">
          {score}%
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyber-green shadow-[0_0_10px_#00FF41]"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function StatClassName(status: string) {
  switch (status) {
    case "COMPLETED":
      return "text-[10px] font-mono font-bold text-cyber-green bg-cyber-green/10 px-2 py-0.5 rounded border border-cyber-green/20";
    case "PROCESSING":
      return "text-[10px] font-mono font-bold text-cyber-blue bg-cyber-blue/10 px-2 py-0.5 rounded border border-cyber-blue/20 animate-pulse";
    case "FAILED":
      return "text-[10px] font-mono font-bold text-cyber-red bg-cyber-red/10 px-2 py-0.5 rounded border border-cyber-red/20";
    default:
      return "text-[10px] font-mono font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20";
  }
}
