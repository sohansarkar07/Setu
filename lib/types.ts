export type InvoiceStatus = 'draft' | 'verified' | 'funded' | 'paid' | 'defaulted';

export interface Invoice {
  id: string;
  chainId?: number;       // actual on-chain u64 invoice ID
  description: string;
  amount: number;
  dueDate: string;
  supplier: string;
  buyer: string;
  status: InvoiceStatus;
  riskTier?: 'A' | 'B' | 'C';
  createdAt: string;
  verifiedAt?: string;
  fundedAt?: string;
  paidAt?: string;
  investor?: string;
  txHash?: string;
  verifyTxHash?: string;
  fundTxHash?: string;
  reserveSkimmed?: number;   // 2% reserve pool skim amount
  netSupplierAmount?: number; // amount - reserveSkimmed
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  type: 'mint' | 'verify' | 'fund' | 'kyc' | 'send';
}

export interface KYCRecord {
  address: string;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

export interface SecondaryListing {
  invoiceId: string;
  seller: string;
  price: number;
  active: boolean;
  createdAt: string;
  listingId?: string;     // unique listing identifier
  discount?: number;      // percentage discount from face value
}

export interface AdminRecord {
  address: string;
  addedAt: string;
  addedBy: string;        // 'genesis' for super-admin, else wallet address
  isSuperAdmin?: boolean;
}

export interface ReservePoolStats {
  totalDeposited: number;
  totalPaidOut: number;
  currentBalance: number;
  lastUpdated: string;
}
