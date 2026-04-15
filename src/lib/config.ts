// AI Model roster and app configuration

export const AI_MODELS = [
    {
        slug: "openai-gpt",
        name: "OpenAI GPT",
        modelKey: "openai/gpt-4o-mini",
        provider: "openai",
        iconUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/openai.svg",
        enabled: true,
    },
    {
        slug: "claude",
        name: "Claude",
        modelKey: "anthropic/claude-3-haiku",
        provider: "anthropic",
        iconUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/anthropic.svg",
        enabled: true,
    },
    {
        slug: "grok",
        name: "Grok",
        modelKey: "x-ai/grok-2",
        provider: "xai",
        iconUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/x.svg",
        enabled: true,
    },
    {
        slug: "nvidia-nemotron",
        name: "NVIDIA Nemotron",
        modelKey: "nvidia/nemotron-4-340b-instruct",
        provider: "nvidia",
        iconUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/nvidia.svg",
        enabled: true,
    },
] as const;

export const STARTING_CAPITAL = 500;
export const MAX_OPEN_POSITIONS = 5;

export const OPENROUTER_BASE_URL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export const MARKET_TYPES = {
    STOCK: "stock",
    CRYPTO: "crypto",
    PREDICTION_MARKET: "prediction_market",
} as const;

export type MarketType = (typeof MARKET_TYPES)[keyof typeof MARKET_TYPES];
