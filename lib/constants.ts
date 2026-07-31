// ─── App-wide constants ───────────────────────────────────────────────────────

/** Deployed Soroban contract IDs on Stellar Testnet */
export const CONTRACT_IDS = {
  INVOICE: process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ID ?? 'CDWDT2VG2LSHG6D2JIEPN43UWF6NF3K5VV5RGDNIT2KF5NJJ3BWZEZIM',
  TOKEN:   process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID   ?? 'CCMEDRG2QBTQA27BPU4DAFOEWW2Q7WNINN6NZX4UUEBYBDJUG47THZP7',
} as const;

/** Stellar network config */
export const STELLAR_NETWORK = {
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  EXPLORER_BASE: 'https://stellar.expert/explorer/testnet',
} as const;

/** Reserve pool skim percentage (matches Soroban contract) */
export const RESERVE_SKIM_PCT = 2;

/** Minimum invoice amount in XLM */
export const MIN_INVOICE_AMOUNT = 10;

/** Maximum invoice amount in XLM */
export const MAX_INVOICE_AMOUNT = 10_000_000;

/** Risk tier labels */
export const RISK_TIER_LABELS: Record<'A' | 'B' | 'C', string> = {
  A: 'Low Risk',
  B: 'Medium Risk',
  C: 'High Risk',
};

/** Risk tier colors (CSS variable names) */
export const RISK_TIER_COLORS: Record<'A' | 'B' | 'C', string> = {
  A: 'var(--neon-green)',
  B: 'var(--warning)',
  C: 'var(--danger)',
};

/** Super admin wallet address */
export const SUPER_ADMIN_ADDRESS = 'GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF';
