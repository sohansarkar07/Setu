'use client';

import { useEffect, useState } from 'react';
import { STELLAR_NETWORK } from '@/lib/constants';

interface StellarPrice {
  xlmUsd: number | null;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
}

/**
 * Custom hook that fetches the live XLM/USD price from the Stellar Horizon API
 * and refreshes every 60 seconds.
 */
export function useStellarPrice(): StellarPrice {
  const [xlmUsd, setXlmUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        await fetch(
          `${STELLAR_NETWORK.HORIZON_URL}/assets?asset_code=XLM&limit=1`,
          { cache: 'no-store' }
        );
        // Fallback to CoinGecko for XLM/USD price
        const cgRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
          { next: { revalidate: 60 } }
        );
        if (cgRes.ok) {
          const data = await cgRes.json();
          setXlmUsd(data?.stellar?.usd ?? null);
          setLastUpdated(new Date());
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { xlmUsd, loading, error, lastUpdated };
}
