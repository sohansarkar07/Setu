import { STELLAR_NETWORK } from './constants';

/**
 * Shortens a Stellar address to format: GABCD...WXYZ
 */
export function shortenAddress(address: string, prefixLen = 4, suffixLen = 4): string {
  if (!address || address.length < prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Returns the Stellar Expert explorer URL for a transaction hash.
 */
export function txExplorerUrl(hash: string): string {
  return `${STELLAR_NETWORK.EXPLORER_BASE}/tx/${hash}`;
}

/**
 * Returns the Stellar Expert explorer URL for an account.
 */
export function accountExplorerUrl(address: string): string {
  return `${STELLAR_NETWORK.EXPLORER_BASE}/account/${address}`;
}

/**
 * Returns the Stellar Expert explorer URL for a contract.
 */
export function contractExplorerUrl(contractId: string): string {
  return `${STELLAR_NETWORK.EXPLORER_BASE}/contract/${contractId}`;
}

/**
 * Validates that a string is a valid Stellar G-address (56 chars starting with G).
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * Formats a number as XLM with 2 decimal places.
 */
export function formatXLM(amount: number): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`;
}

/**
 * Computes days remaining until a due date string.
 */
export function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-readable label for an invoice due date status.
 */
export function dueDateLabel(dueDate: string): { label: string; urgent: boolean } {
  const days = daysUntilDue(dueDate);
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, urgent: true };
  if (days === 0) return { label: 'Due today', urgent: true };
  if (days <= 7) return { label: `Due in ${days}d`, urgent: true };
  return { label: `Due in ${days}d`, urgent: false };
}
