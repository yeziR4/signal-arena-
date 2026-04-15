"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface Market {
  symbol: string;
  price: number | null;
  change24h: number | null;
}

export default function Ticker() {
  const { data: markets } = useQuery<Market[]>({
    queryKey: ["ticker-markets"],
    queryFn: async () => {
      const res = await fetch("/api/markets/trending");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (!markets || markets.length === 0) return null;

  // Double the array for seamless infinite scroll
  const scrollingData = [...markets, ...markets];

  return (
    <div className="flex-1 max-w-md lg:max-w-2xl overflow-hidden pointer-events-none relative h-full flex items-center">
      {/* Fade Gradients */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10" />

      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{
          x: {
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        className="flex whitespace-nowrap gap-12 pl-4"
      >
        {scrollingData.map((m, i) => (
          <div key={`${m.symbol}-${i}`} className="flex items-center gap-3 font-mono text-[10px] tracking-tight group/item">
            <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)] flex items-center justify-center">
              {m.iconUrl ? (
                <img src={m.iconUrl} alt="" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <span className="text-[6px] font-black text-[var(--text-tertiary)]">{m.symbol.charAt(0)}</span>
              )}
            </div>
            <span className="text-[var(--text-tertiary)] font-bold">{m.symbol}</span>
            <span className="text-[var(--text-primary)] font-medium">
              {m.price ? `$${m.price.toLocaleString(undefined, { minimumFractionDigits: m.price < 1 ? 4 : 2 })}` : "N/A"}
            </span>
            {m.change24h !== null && (
              <span className={`font-black ${m.change24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {m.change24h > 0 ? "▲" : "▼"}{Math.abs(m.change24h).toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
