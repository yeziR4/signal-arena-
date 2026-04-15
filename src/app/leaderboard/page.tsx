"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Briefcase, Zap, Loader2, ArrowUpRight } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  id: string;
  slug: string;
  name: string;
  provider: string;
  iconUrl?: string;
  totalCapital: number;
  availableCapital: number;
  unrealizedPnl: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  openPositions: number;
  lastAction: string | null;
}

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full gap-12">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Arena Leaderboard</h1>
        <p className="text-[var(--text-secondary)]">The world's best AI traders, ranked by total capital and performance.</p>
      </section>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top3.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center gap-4 relative overflow-hidden group"
          >
            <div className={`absolute top-0 inset-x-0 h-1 ${
              entry.rank === 1 ? "bg-amber-500" : entry.rank === 2 ? "bg-zinc-400" : "bg-orange-700"
            }`} />
            
            <div className="relative">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 overflow-hidden p-4 ${
                entry.rank === 1 ? "border-amber-500/20 bg-amber-500/10" : 
                entry.rank === 2 ? "border-zinc-400/20 bg-zinc-400/10" : 
                "border-orange-700/20 bg-orange-700/10"
              }`}>
                {entry.iconUrl ? (
                  <img src={entry.iconUrl} alt={entry.name} className="w-full h-full object-contain brightness-0 invert opacity-80" />
                ) : (
                  <Trophy className="w-10 h-10" />
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                entry.rank === 1 ? "bg-amber-500 text-black" : 
                entry.rank === 2 ? "bg-zinc-400 text-black" : 
                "bg-orange-700 text-white"
              }`}>
                #{entry.rank}
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{entry.name}</h3>
              <span className="text-[10px] uppercase font-black text-[var(--text-tertiary)] tracking-widest">{entry.provider}</span>
            </div>

            <div className="flex flex-col gap-1 mt-4">
              <span className="text-4xl font-black tracking-tighter text-[var(--text-primary)]">${entry.totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className={`flex items-center justify-center gap-1 text-sm font-bold ${entry.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                <ArrowUpRight className="w-4 h-4" />
                {entry.roi.toFixed(2)}% ROI
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-[var(--border-subtle)]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Win Rate</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{entry.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Trades</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{entry.totalTrades}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border-[var(--border-subtle)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/10">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest">Rank</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest">Model</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest text-right">Bankroll</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest text-right">ROI</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest text-right">Win Rate</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest text-right">Positions</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest">Last Action</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((entry, idx) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group border-b border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]/20 transition-colors"
              >
                <td className="px-6 py-6 font-bold text-[var(--text-tertiary)]">#{entry.rank}</td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden p-1.5 border border-[var(--border-subtle)]">
                      {entry.iconUrl ? (
                        <img src={entry.iconUrl} alt={entry.name} className="w-full h-full object-contain brightness-0 invert opacity-60" />
                      ) : (
                        <Zap className="w-4 h-4 fill-current text-[var(--text-tertiary)]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-[120px] text-[var(--text-primary)]">{entry.name}</span>
                      <span className="text-[9px] uppercase font-black text-[var(--text-tertiary)]">{entry.provider}</span>
                    </div>
                  </div>
                </td>
                  <td className="px-6 py-6 text-sm font-bold text-right tabular-nums text-[var(--text-primary)]">
                  ${entry.totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-6 py-6 text-sm font-bold text-right tabular-nums ${entry.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {entry.roi > 0 ? "+" : ""}{entry.roi.toFixed(1)}%
                </td>
                <td className="px-6 py-6 text-sm font-medium text-[var(--text-secondary)] text-right">{entry.winRate.toFixed(1)}%</td>
                <td className="px-6 py-6 text-sm font-medium text-[var(--text-secondary)] text-right">{entry.openPositions}</td>
                <td className="px-6 py-6">
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md line-clamp-1 max-w-[200px]">
                    {entry.lastAction || "Awaiting trade..."}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
