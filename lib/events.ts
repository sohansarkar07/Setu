import { server } from './soroban';
import type { rpc } from '@stellar/stellar-sdk';

const INVOICE_CONTRACT_ID = process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ID!;

export type SetuEvent = {
  type: 'mint' | 'verify' | 'fund' | 'paid' | 'kyc' | 'init';
  invoiceId?: bigint;
  amount?: bigint;
  address?: string;
  ledger: number;
  txHash: string;
};

/**
 * Fetch recent contract events from Soroban RPC.
 * Returns the last `limit` events from the contract.
 */
export async function fetchContractEvents(
  startLedger: number = 0,
  limit: number = 20
): Promise<SetuEvent[]> {
  try {
    const response = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [INVOICE_CONTRACT_ID],
        },
      ],
      limit,
    });

    return response.events.map((event) => {
      const topicSymbol = event.topic[0]?.value?.toString() ?? '';
      return {
        type: topicSymbol as SetuEvent['type'],
        txHash: event.txHash,
        ledger: event.ledger,
      };
    });
  } catch (error) {
    console.error('Failed to fetch contract events:', error);
    return [];
  }
}

/**
 * Poll for new contract events every `intervalMs` milliseconds.
 * Calls `onEvent` for each new event found.
 * Returns a cleanup function to stop polling.
 */
export function startEventPolling(
  onEvent: (event: SetuEvent) => void,
  intervalMs: number = 10000
): () => void {
  let lastLedger = 0;
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const ledgerInfo = await server.getLatestLedger();
      const currentLedger = ledgerInfo.sequence;

      if (lastLedger === 0) {
        // First poll — set baseline, don't emit old events
        lastLedger = currentLedger;
        return;
      }

      if (currentLedger > lastLedger) {
        const events = await fetchContractEvents(lastLedger + 1);
        events.forEach(onEvent);
        lastLedger = currentLedger;
      }
    } catch (error) {
      console.error('Event polling error:', error);
    }
  };

  // Poll immediately then on interval
  poll();
  const interval = setInterval(poll, intervalMs);

  return () => {
    active = false;
    clearInterval(interval);
  };
}
