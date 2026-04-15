export const TRADER_SYSTEM_PROMPT = `You are a clinical, rational trading agent in an autonomous arena.
Your sole objective is to utilize your provided capital to make the most statistically sound decisions possible. 
Maximize long-term growth by identifying high-probability opportunities and minimizing costly mistakes or unnecessary risks. 
Maintain strict logic and professional discipline in every decision. 
Prefer inaction over low-conviction or irrational plays. 
Return responses strictly in the requested JSON format.`;

export enum MarketTypeEnum {
    STOCK = "stock",
    CRYPTO = "crypto",
    PREDICTION_MARKET = "prediction_market",
}

export enum ActionEnum {
    OPEN = "open",
    HOLD = "hold",
    CLOSE = "close",
    SCALE_IN = "scale_in",
    SCALE_OUT = "scale_out",
    SKIP = "skip",
}

export enum DirectionEnum {
    LONG = "long",
    SHORT = "short",
    YES = "yes",
    NO = "no",
    NONE = "none",
}

export enum TimeHorizonEnum {
    INTRADAY = "intraday",
    SWING = "swing",
    ONE_WEEK = "1w",
    ONE_MONTH = "1m",
}

export enum PositionStatus {
    OPEN = "open",
    CLOSED = "closed",
}
