'use client';

import { useState, useEffect, useCallback } from 'react';
import { startEventPolling, fetchContractEvents, type SetuEvent } from '@/lib/events';

/**
 * Hook to subscribe to real-time Soroban contract events.
 */
export function useContractEvents() {
  const [events, setEvents] = useState<SetuEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestTxHash, setLatestTxHash] = useState<string | null>(null);

  // Load initial events
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      const initial = await fetchContractEvents(0, 10);
      setEvents(initial.reverse()); // newest first
      setIsLoading(false);
    };
    loadInitial();
  }, []);

  // Start polling for new events
  useEffect(() => {
    const stopPolling = startEventPolling((event) => {
      setEvents((prev) => [event, ...prev.slice(0, 49)]); // keep last 50
      setLatestTxHash(event.txHash);
    }, 15000); // Poll every 15 seconds

    return stopPolling;
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, isLoading, latestTxHash, clearEvents };
}

/**
 * Hook to get a Stellar Expert explorer link for a transaction.
 */
export function useStellarExplorerLink(txHash: string | null | undefined): string | null {
  if (!txHash) return null;
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
