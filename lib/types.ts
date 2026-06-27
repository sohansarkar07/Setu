export type InvoiceStatus = 'draft' | 'verified' | 'funded' | 'paid' | 'defaulted';

export interface Invoice {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  supplier: string;
  buyer: string;
  status: InvoiceStatus;
  createdAt: string;
  verifiedAt?: string;
  fundedAt?: string;
  investor?: string;
  txHash?: string;
  verifyTxHash?: string;
  fundTxHash?: string;
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
