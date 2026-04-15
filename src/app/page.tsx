"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Search, 
  BarChart2, 
  Zap, 
  ArrowUpRight, 
  Loader2,
  Globe,
  Coins,
  LineChart,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface Market {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number | null;
  change24h: number | null;
  volume: number | null;
  source: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ["markets", "trending"],
    queryFn: async () => {
      const res = await fetch("/api/markets/trending");
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
  });

  const filteredMarkets = markets?.filter(m => activeTab === "all" || m.type === activeTab) || [];

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full gap-12 pt-16">
      {/* Hero Header */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-500 tracking-widest w-fit">
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
            Live Market Feed
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white">
            Market Discovery
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl font-medium">
            Explore trending assets across global markets. Select any ticker to trigger an independent AI evaluation and risk assessment.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
          <div className="bg-[#161619] border border-white/5 rounded-2xl p-1.5 flex w-fit">
            {[
              { id: "all", label: "All", icon: <Globe className="w-4 h-4" /> },
              { id: "stock", label: "Stocks", icon: <LineChart className="w-4 h-4" /> },
              { id: "crypto", label: "Crypto", icon: <Coins className="w-4 h-4" /> },
              { id: "prediction_market", label: "Predictions", icon: <Zap className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                  activeTab === tab.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            href="/search"
            className="group flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
          >
            <Search className="w-4 h-4 text-zinc-500" />
            Manually Resolve Asset
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        </div>
      </section>

      {/* Markets Grid */}
      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-t-2 border-amber-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500 fill-current" />
            </div>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Synchronizing Global Data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredMarkets.map((market, idx) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                href={`/search?input=${market.symbol}`}
                className="group relative block bg-[#161619] border border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-white/[0.04] hover:border-white/20 hover:-translate-y-1 shadow-2xl"
              >
                {/* Decorative Background Symbol */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 text-white/5 text-9xl font-black select-none pointer-events-none group-hover:text-amber-500/5 transition-colors">
                  {market.symbol.substring(0, 1)}
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex gap-5">
                    <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-amber-500 overflow-hidden transition-all duration-300">
                      {market.iconUrl ? (
                         <img src={market.iconUrl} alt="" className="w-full h-full object-contain p-2 group-hover:brightness-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        market.type === "crypto" ? <Coins className="w-6 h-6" /> : market.type === "stock" ? <TrendingUp className="w-6 h-6" /> : <Zap className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-black text-xl text-white group-hover:text-amber-500 transition-colors line-clamp-1">{market.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{market.symbol}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{market.source}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-10 relative z-10">
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price</span>
                     <span className="text-2xl font-black text-white tabular-nums">
                        {market.price !== null ? (
                          market.type === 'prediction_market' ? `${(market.price * 100).toFixed(0)}¢` : `$${market.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ) : "N/A"}
                     </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Performance</span>
                     {market.change24h !== null ? (
                       <div className={`text-2xl font-black tabular-nums ${market.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                         {market.change24h > 0 ? "+" : ""}{market.change24h.toFixed(2)}%
                       </div>
                     ) : (
                       <span className="text-xl font-bold text-zinc-700">--</span>
                     )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Volume (24h)</span>
                    <span className="text-xs font-bold text-zinc-400">
                      {market.volume ? `$${(market.volume / 1000000).toFixed(1)}M` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 group/btn">
                    <span className="text-[10px] font-black text-amber-500 transition-all uppercase tracking-widest group-hover:mr-2">Evaluate</span>
                    <ArrowUpRight className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredMarkets.length === 0 && (
         <div className="py-40 flex flex-col items-center justify-center gap-6 glass-panel rounded-[4rem] text-zinc-700 border-white/5">
            <BarChart2 className="w-16 h-16 opacity-10" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg font-black text-white">No assets detected</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-500 text-center max-w-xs">The market you're looking for might be offline or outside our tracking parameters.</span>
            </div>
         </div>
      )}
    </div>
  );
}
