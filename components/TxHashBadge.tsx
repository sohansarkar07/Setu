'use client';

import { ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { useClipboard } from '@/lib/hooks/useClipboard';
import { txExplorerUrl } from '@/lib/stellar';

interface TxHashBadgeProps {
  hash: string;
  label?: string;
  shorten?: boolean;
}

/**
 * Displays a transaction hash with copy-to-clipboard and Stellar Expert explorer link.
 */
export default function TxHashBadge({ hash, label = 'Tx', shorten = true }: TxHashBadgeProps) {
  const { copied, copy } = useClipboard();

  if (!hash || hash.length < 10) return null;

  const display = shorten ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono"
      style={{
        background: 'rgba(0,200,255,0.05)',
        border: '1px solid rgba(0,200,255,0.15)',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span>{display}</span>
      <button
        onClick={() => copy(hash)}
        title="Copy full hash"
        className="hover:opacity-70 transition-opacity"
        style={{ color: copied ? 'var(--neon-green)' : 'var(--text-muted)' }}
      >
        {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
      </button>
      <a
        href={txExplorerUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Stellar Expert"
        className="hover:opacity-70 transition-opacity"
        style={{ color: 'var(--neon-cyan)' }}
      >
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
