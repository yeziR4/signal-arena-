"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Position {
  id: string;
  direction: string;
  status: string;
  sizeUsd: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  confidence: number;
  reasoning: string;
  openedAt: string;
  closedAt: string | null;
  asset: {
    symbol: string;
    name: string;
    type: string;
    iconUrl?: string | null;
  };
  aiTrader: {
    name: string;
    slug: string;
    iconUrl?: string | null;
  };
}

export default function PortfolioPage() {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: traders } = useQuery<any[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch traders");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: positions, isLoading } = useQuery<Position[]>({
    queryKey: ["positions", statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      
      const res = await fetch(`/api/positions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch positions");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const stats = positions?.reduce((acc, pos) => {
    acc.totalInvested += pos.sizeUsd;
    acc.totalPnl += pos.pnl;
    return acc;
  }, { totalInvested: 0, totalPnl: 0 }) || { totalInvested: 0, totalPnl: 0 };

  const arenaLiquid = traders?.reduce((acc, t) => acc + t.totalCapital, 0) || 0;

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 5000); // Reset button state after 5s
      return;
    }
    
    setIsResetting(true);
    setShowConfirm(false);
    try {
      const res = await fetch("/api/traders/reset", { method: "POST" });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["positions"] });
        await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      } else {
        alert("Failed to reset arena.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full gap-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-zinc-400">Track all active and historical trades across the arena.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-1 flex">
            {["open", "closed", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                  statusFilter === s ? "bg-[var(--text-primary)] text-[var(--bg-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl px-4 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Markets</option>
            <option value="stock">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="prediction_market">Predictions</option>
          </select>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className={`group flex items-center gap-2 px-6 py-2 border text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-50 ${
              showConfirm 
                ? "bg-red-500 border-red-500 text-white animate-pulse" 
                : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
            }`}
          >
            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : showConfirm ? <Activity className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {showConfirm ? "CLICK AGAIN TO RESET" : "Reset Arena"}
          </button>
        </div>
      </section>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-2">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Arena Bankroll</span>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500/50" />
            <span className="text-3xl font-black tabular-nums text-[var(--text-primary)]">${arenaLiquid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-2">
          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Current Exposure</span>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--text-tertiary)] opacity-60" />
            <span className="text-3xl font-black tabular-nums text-[var(--text-primary)]">${stats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-2">
          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Total PnL</span>
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${stats.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`} />
            <span className={`text-3xl font-black tabular-nums ${stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${Math.abs(stats.totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-2">
          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Active Models</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--text-tertiary)] opacity-60" />
            <span className="text-3xl font-black tabular-nums text-[var(--text-primary)]">{Array.from(new Set(positions?.map(p => p.aiTrader.slug))).length}</span>
          </div>
        </div>
      </div>

      {/* Positions Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-tertiary)]">Live Positions</h2>
        
        {isLoading ? (
          <div className=" py-20 flex flex-col items-center justify-center gap-4 text-zinc-600">
             <Loader2 className="w-8 h-8 animate-spin" />
             <span className="text-xs font-bold uppercase tracking-widest">Loading Portfolio...</span>
          </div>
        ) : positions && positions.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {positions.map((pos) => (
              <motion.div
                key={pos.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-[#161619] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all overflow-hidden"
              >
                {/* Glow Background */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full pointer-events-none opacity-20 ${
                  pos.pnl >= 0 ? "bg-emerald-500" : "bg-red-500"
                }`} />

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden p-2">
                      {pos.asset.iconUrl ? (
                         <img src={pos.asset.iconUrl} alt={pos.asset.symbol} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">{pos.asset.type === 'crypto' ? '🪙' : pos.asset.type === 'stock' ? '📈' : '🔮'}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg text-[var(--text-primary)]">{pos.asset.name}</h4>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded uppercase">{pos.asset.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                        {pos.aiTrader.iconUrl && (
                          <div className="w-4 h-4 rounded-sm bg-[var(--bg-secondary)] p-0.5 flex items-center justify-center overflow-hidden">
                             <img src={pos.aiTrader.iconUrl} alt="" className="w-full h-full object-contain brightness-0 invert opacity-60" />
                          </div>
                        )}
                        <span className="font-bold text-[var(--text-secondary)] capitalize">{pos.aiTrader.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 opacity-60">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(pos.openedAt))} ago
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      pos.direction === 'long' || pos.direction === 'yes' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {pos.direction}
                    </div>
                    <div className="text-xl font-black tabular-nums text-[var(--text-primary)]">${pos.sizeUsd.toFixed(2)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 border-t border-[var(--border-subtle)] pt-6 relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Entry</span>
                    <span className="text-sm font-bold text-[var(--text-secondary)]">
                      {pos.asset.type === 'prediction_market' ? `${(pos.entryPrice * 100).toFixed(0)}¢` : `$${pos.entryPrice.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Current</span>
                    <span className="text-sm font-bold text-[var(--text-secondary)]">
                      {pos.asset.type === 'prediction_market' ? `${(pos.currentPrice * 100).toFixed(0)}¢` : `$${pos.currentPrice.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Profit / Loss</span>
                    <span className={`text-sm font-bold ${pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pos.pnl >= 0 ? "+" : ""}${Math.abs(pos.pnl).toFixed(2)} ({pos.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] group-hover:bg-[var(--bg-card-hover)] transition-colors relative z-10">
                  <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                    "{pos.reasoning}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center gap-4 glass-panel rounded-[3rem] text-[var(--text-tertiary)]">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
              <Layers className="w-8 h-8 opacity-20" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold">No positions found</span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Visit the Arena to place a bet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
