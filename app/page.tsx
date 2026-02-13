import { syncUser } from "@/lib/syncUser";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Terminal, ArrowRight, Zap, Code2, Shield } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    await syncUser();
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background cyber-grid relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-blue/10 rounded-full blur-[120px] -z-10" />

      <main className="max-w-6xl w-full px-8 flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-16 h-16 rounded-2xl bg-cyber-blue flex items-center justify-center shadow-[0_0_30px_rgba(46,91,255,0.4)]">
          <Terminal className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-sans font-black tracking-tighter text-white">
            CODE <span className="text-cyber-blue">REVIWER</span>
          </h1>
          <p className="text-xl text-zinc-500 font-medium max-w-2xl mx-auto">
            Hyper-precise AI analysis for modern engineering teams. Automate
            your PR reviews with 1.5 Flash speed and custom logic.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/sign-up"
            className="h-14 px-8 rounded-2xl bg-cyber-blue text-white font-bold flex items-center space-x-2 hover:bg-cyber-blue/80 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(46,91,255,0.3)]"
          >
            <span>Initialize Engine</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/sign-in"
            className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center space-x-2 hover:bg-white/10 transition-all"
          >
            <span>Access Terminal</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 w-full">
          <FeatureCard
            icon={Zap}
            title="Flash Inference"
            desc="Review entire PRs in under 2 seconds using Google's latest model."
          />
          <FeatureCard
            icon={Code2}
            title="Custom Patterns"
            desc="Define your own reviewer persona and custom analysis rules."
          />
          <FeatureCard
            icon={Shield}
            title="Security First"
            desc="Enterprise-grade privacy with local database isolation."
          />
        </div>
      </main>

      <footer className="fixed bottom-8 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
        System 01 // Node-Alpha // 2026.02
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass p-8 rounded-3xl border-white/5 text-left group hover:border-cyber-blue/30 transition-all duration-500">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-cyber-blue group-hover:text-white transition-all">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}
