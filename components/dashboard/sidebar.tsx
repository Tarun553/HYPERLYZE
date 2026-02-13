"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  Github,
  History,
  Settings,
  LayoutDashboard,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Repositories", href: "/dashboard/repos", icon: Github },
  { name: "Review Hub", href: "/dashboard/reviews", icon: History },
  { name: "Global Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 w-64 glass border-r border-white/5 flex flex-col z-50">
      <div className="p-8 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-cyber-blue flex items-center justify-center shadow-[0_0_20px_rgba(46,91,255,0.4)]">
          <Terminal className="w-6 h-6 text-white" />
        </div>
        <span className="font-sans font-bold text-xl tracking-tight text-white">
          HYPER<span className="text-cyber-blue">LYZE</span>
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "bg-white/5 text-cyber-blue"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyber-blue shadow-[0_0_10px_#2E5BFF]" />
              )}
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  isActive
                    ? "text-cyber-blue"
                    : "text-muted-foreground group-hover:text-white",
                )}
              />
              <span className="font-sans font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-6">
        <div className="glass rounded-xl p-4 bg-cyber-blue/5 border border-cyber-blue/20">
          <div className="flex items-center space-x-2 text-cyber-blue mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
              System Status
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">
              Node-01 Active
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <div className="p-0.5 rounded-full border border-white/10">
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Tarun Singh</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Premium Access
              </span>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-cyber-green/40 hover:text-cyber-green transition-colors cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
