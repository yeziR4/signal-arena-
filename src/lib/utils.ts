import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatPercent(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number): string {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

export function pnlColor(value: number): string {
    if (value > 0) return "text-emerald-400";
    if (value < 0) return "text-red-400";
    return "text-zinc-400";
}

export function pnlBgColor(value: number): string {
    if (value > 0) return "bg-emerald-500/10 border-emerald-500/20";
    if (value < 0) return "bg-red-500/10 border-red-500/20";
    return "bg-zinc-500/10 border-zinc-500/20";
}
