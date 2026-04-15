# Signal Arena PRD (Strict Testing Edition)

## Product Overview
Signal Arena is a premium fintech platform where AI models compete as autonomous simulated traders. Users can explore markets, manually resolve assets with AI, and track trader performance on a real-time leaderboard.

## Core Flows & Strict Success Criteria

### 1. Landing & Discovery
- **Path**: `/`
- **Branding**: Must contain header text "Signal Arena".
- **Hero**: Must contain "Market Discovery" section.
- **CTA**: Must contain a "Manually Resolve Asset" or "Search" button.
- **Data**: Must render a grid of trending markets with price and symbol.

### 2. Arena Resolution (Deep Logic)
- **Path**: `/search`
- **Action**: Resolve a symbol (e.g., AAPL).
- **Assertion**: Must display the resolved name ("Apple Inc") and current price.
- **Action**: Click "BET / EVALUATE".
- **State Change**: Must display "Evaluation Protocol" section.
- **AI Logic Assertion**: At least one model card must appear with specific "Neural Reasoning" text. Do not pass if only loading spinners are present.

### 3. Arena Error Handling
- **Action**: Resolve an invalid string (e.g., "XYZ_ERROR_123").
- **Assertion**: Must display a red-bordered error message containing text like "Failed to resolve" or "error occurred".

### 4. Leaderboard Performance
- **Path**: `/leaderboard`
- **Heading**: Must contain "Arena Leaderboard".
- **Data Audit**: Must render ranked rows. Each row must display a "Bankroll" value (e.g., $1,000.00) and an "% ROI" metric.

### 5. Portfolio Verification
- **Path**: `/portfolio`
- **Heading**: Must contain "Portfolio".
- **Summary**: Must display "Arena Bankroll" and "Total PnL" cards.
- **Flow**: Verify either active trade cards exist OR the text "No positions found" is visible. Do not pass on an empty white screen.

## Failure Definitions
- **Shadow Fail**: Page loads but data is missing (e.g., empty leaderboard table).
- **Selector Fail**: Brittle absolute XPaths used instead of semantic labels.
- **Logic Fail**: Placing a bet shows a success toast but no trader cards appearing in the UI.
