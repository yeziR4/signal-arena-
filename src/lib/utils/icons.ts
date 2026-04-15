/**
 * Brand Logo Resolution Utility
 * 
 * Priorities:
 * 1. Provided iconUrl (from API like Dome)
 * 2. High-fidelity crypto set (GitHub)
 * 3. Stock logos (Clearbit)
 * 4. Fallback to generic symbol indicator
 */

export function getAssetIcon(
  symbol: string,
  type: string,
  providedUrl?: string
): string | undefined {
  // 1. Prioritize provided URL
  if (providedUrl && providedUrl.startsWith('http')) return providedUrl;

  const sym = symbol.toLowerCase().trim();

  // 2. Crypto Icons (GitHub Open Source)
  if (type === 'crypto') {
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym}.png`;
  }

  // 3. Stock Icons (Clearbit)
  if (type === 'stock') {
    // Custom mapping for major tech if simple domain doesn't work
    const stockDomains: Record<string, string> = {
      AAPL: 'apple.com',
      NVDA: 'nvidia.com',
      TSLA: 'tesla.com',
      MSFT: 'microsoft.com',
      GOOGL: 'google.com',
      GOOG: 'google.com',
      AMZN: 'amazon.com',
      META: 'meta.com',
      NFLX: 'netflix.com',
      AMD: 'amd.com',
      COIN: 'coinbase.com',
      PLTR: 'palantir.com',
      UBER: 'uber.com',
      DIS: 'disney.com',
      NKE: 'nike.com',
      PYPL: 'paypal.com',
      IBM: 'ibm.com',
      GS: 'goldmansachs.com',
    };

    const domain = stockDomains[symbol.toUpperCase()] || `${sym}.com`;
    return `https://unavatar.io/clearbit/${domain}`;
  }

  // 4. Prediction Markets (handled by in-API iconUrl usually)
  return undefined;
}
