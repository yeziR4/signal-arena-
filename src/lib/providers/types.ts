// Normalized market data shape used by all providers

export interface ResolvedMarket {
    id: string;
    symbol: string;
    name: string;
    type: "stock" | "crypto" | "prediction_market";
    currentPrice: number;
    change24h: number | null;
    chartData: ChartPoint[];
    metadata: MarketMetadata;
    source: string;
    iconUrl?: string;
}

export interface ChartPoint {
    time: string;
    value: number;
}

export interface MarketMetadata {
    marketCap?: number;
    volume?: number;
    probabilityYes?: number;
    probabilityNo?: number;
    closeDate?: string;
    category?: string;
    description?: string;
    [key: string]: unknown;
}

export interface ProviderResult {
    success: boolean;
    data?: ResolvedMarket;
    error?: string;
}
