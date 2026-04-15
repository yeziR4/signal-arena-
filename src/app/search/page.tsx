"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity, Settings2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { AI_MODELS } from "@/lib/config";

interface ResolvedMarket {
  id: string;
  symbol: string;
  name: string;
  type: string;
  currentPrice: number;
  change24h: number;
  chartData: { time: string; value: number }[];
  metadata: any;
  source: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const queryParam = searchParams.get("input") || searchParams.get("symbol") || "";

  const [input, setInput] = useState(queryParam);
  const [isLoading, setIsLoading] = useState(false);
  const [market, setMarket] = useState<ResolvedMarket | null>(null);
  const [asset, setAsset] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBetting, setIsBetting] = useState(false);
  const [decisions, setDecisions] = useState<any[]>([]);

  // Fetch real trader data for the sidebar
  const { data: traders } = useQuery<any[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch traders");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const handleSearch = async (e?: React.FormEvent, searchInput?: string) => {
    e?.preventDefault();
    const finalInput = searchInput || input;
    if (!finalInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setDecisions([]);
    setMarket(null);

    try {
      const res = await fetch("/api/resolve-input", {
        method: "POST",
        body: JSON.stringify({ input: finalInput }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();
      if (res.ok) {
        setMarket(result.market);
        setAsset(result.asset);
      } else {
        setError(result.error || "Failed to resolve market");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resolve on mount if query param is present
  useEffect(() => {
    if (queryParam) {
      handleSearch(undefined, queryParam);
    }
  }, [queryParam]);

  const handleBet = async () => {
    if (!market) return;
    setIsBetting(true);
    setDecisions([]);

    try {
      const res = await fetch("/api/bet", {
        method: "POST",
        body: JSON.stringify({ 
          assetId: asset?.id || market.id, 
          symbol: market.symbol, 
          type: market.type 
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();
      if (res.ok) {
        setDecisions(result.decisions);
        // Invalidate queries to update liquid balance and portfolio
        await queryClient.invalidateQueries({ queryKey: ["positions"] });
        await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      } else {
        console.error("Bet error:", result.error);
      }
    } catch (err) {
      console.error("An error occurred during betting.");
    } finally {
      setIsBetting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full gap-8">
      {/* Search Header */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <Search className="w-8 h-8 text-amber-500" />
            Evaluation Search
          </h1>
          <p className="text-[var(--text-secondary)]">Search any stock, crypto, or Prediction Market to evaluate with AI.</p>
        </div>

        <form onSubmit={handleSearch} className="relative group max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search AAPL, BTC, or paste Polymarket URL..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-white text-black text-xs font-bold px-5 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            Resolve
          </button>
        </form>
      </section>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        {market && (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Market Card */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-8 relative overflow-hidden border-white/10">
                <div className="absolute top-0 right-0 p-12 text-zinc-800 opacity-20 pointer-events-none">
                  <TrendingUp className="w-48 h-48" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center">
                        {market.iconUrl ? (
                          <img src={market.iconUrl} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-[10px] font-black text-zinc-500">{market.symbol.charAt(0)}</span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest">{market.type === 'prediction_market' ? 'Prediction' : market.type}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">via {market.source}</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tight text-[var(--text-primary)] mt-4">{market.name}</h2>
                    <span className="text-xl text-[var(--text-tertiary)] font-black uppercase tracking-[0.2em]">{market.symbol}</span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="text-5xl font-black tracking-tighter text-[var(--text-primary)] tabular-nums">
                      {market.type === 'prediction_market' ? `${(market.currentPrice * 100).toFixed(0)}¢` : `$${market.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </div>
                    <div className={`flex items-center gap-1.5 text-lg font-black ${market.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {market.change24h >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      {Math.abs(market.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="h-[250px] -mx-8 -mb-8 mt-4 overflow-hidden mask-fade-edges relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={market.chartData}>
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: '#161619', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={market.change24h >= 0 ? "#34d399" : "#f87171"}
                        strokeWidth={6}
                        dot={false}
                        animationDuration={2000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between p-8 rounded-[2rem] bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center">
                    <Settings2 className="w-6 h-6 text-[var(--text-tertiary)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest">Agent Protocol</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Ready for evaluation cycle</span>
                  </div>
                </div>
                <button
                  onClick={handleBet}
                  disabled={isBetting}
                  className="group relative flex items-center gap-2 px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isBetting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      EVALUATING...
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6 fill-current" />
                      BET / EVALUATE
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-8 rounded-[2rem] flex flex-col gap-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Market Metrics
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 rounded-2xl bg-white/5 flex flex-col gap-1 border border-white/5">
                    <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">Volume (24h)</span>
                    <span className="text-2xl font-black text-white">${market.metadata.volume?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 flex flex-col gap-1 border border-white/5">
                    <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">Session High</span>
                    <span className="text-2xl font-black text-white">${market.metadata.high || market.currentPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* AI Roster Status */}
              <div className="glass-panel p-8 rounded-[2rem] flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <BotIcon className="w-4 h-4" />
                    AI Competitors
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 tracking-widest">ONLINE</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {AI_MODELS.filter(m => m.enabled).map((model) => {
                    const traderData = traders?.find(t => t.slug === model.slug);
                    const liquidCapital = traderData ? (traderData.availableCapital + traderData.unrealizedPnl) : 500;
                    
                    return (
                      <div key={model.slug} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded bg-[var(--bg-secondary)] p-1 flex items-center justify-center overflow-hidden">
                             <img src={model.iconUrl} alt="" className="w-full h-full object-contain brightness-0 invert opacity-70" />
                          </div>
                          <span className="text-xs font-bold text-[var(--text-secondary)]">{model.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-[var(--text-primary)] tabular-nums">
                          ${liquidCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Decisions Section */}
      <AnimatePresence>
        {decisions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-12 mt-12 border-t border-white/10 pt-16 mb-20"
          >
            <div className="flex items-center gap-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h2 className="text-xs font-black uppercase tracking-[0.5em] text-[#d4a853]">Evaluation Protocol 0.82</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {decisions.map((decision, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`group p-[1px] rounded-[2.5rem] ${decision.action === 'open' ? 'bg-gradient-to-br from-emerald-500/40 via-transparent to-transparent' : 'bg-white/5'}`}
                >
                  <div className="bg-[#0a0a0b] rounded-[2.4rem] p-8 h-full flex flex-col gap-8 group-hover:bg-[#111113] transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl flex items-center justify-center overflow-hidden ${decision.action === 'open' ? 'bg-emerald-500/10' : 'bg-[var(--bg-secondary)]'}`}>
                          {decision.iconUrl ? (
                             <img src={decision.iconUrl} alt="" className={`w-8 h-8 object-contain brightness-0 invert ${decision.action === 'open' ? 'opacity-90' : 'opacity-40'}`} />
                          ) : (
                             <Zap className={`w-6 h-6 ${decision.action === 'open' ? 'text-emerald-400 fill-current' : 'text-[var(--text-tertiary)]'}`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-[var(--text-primary)]">{decision.traderName}</h4>
                          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-black tracking-widest">{decision.modelKey?.split('/')[1] || decision.modelKey || "External Model"}</span>
                        </div>
                      </div>
                      <div>
                        {decision.status === 'position_opened' ? (
                          <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <ArrowUpRight className="w-3 h-3" />
                            ORDER FILLED
                          </span>
                        ) : decision.status === 'rejected' ? (
                          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="w-3 h-3" />
                            REJECTED: {decision.reason || "RISK LIMIT"}
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                            {decision.status === 'skipped' ? 'SKIPPED' : 'DISCARDED'}
                          </span>
                        )}
                      </div>
                    </div>

                    {decision.status === 'position_opened' && (
                      <div className="flex items-center justify-between border-y border-[var(--border-subtle)] py-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Allocation</span>
                          <span className="text-3xl font-black text-[var(--text-primary)] tabular-nums">${decision.sizeUsd.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Bias</span>
                          <span className={`text-3xl font-black uppercase tracking-widest ${decision.direction === 'long' || decision.direction === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {decision.direction}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Trust</span>
                          <span className="text-3xl font-black text-amber-500 tabular-nums">{decision.confidence}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Neural Reasoning</span>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium italic opacity-90">
                        "{decision.reasoning}"
                      </p>
                    </div>

                    {decision.riskNote && (
                      <div className="mt-auto pt-6 flex items-center gap-3 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-t border-white/5">
                        <Activity className="w-4 h-4 text-zinc-600" />
                        {decision.riskNote}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
