'use client';

import { RISK_TIER_COLORS, RISK_TIER_LABELS } from '@/lib/constants';

interface RiskBadgeProps {
  tier: 'A' | 'B' | 'C';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Displays an AI risk tier badge (A / B / C) with colour coding.
 */
export default function RiskBadge({ tier, showLabel = false, size = 'md' }: RiskBadgeProps) {
  const color = RISK_TIER_COLORS[tier];
  const label = RISK_TIER_LABELS[tier];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${padding}`}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
      }}
      title={`AI Risk Score: ${label}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: color }}
      />
      {tier}
      {showLabel && <span className="font-normal opacity-80 text-xs">· {label}</span>}
    </span>
  );
}
