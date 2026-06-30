'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Invoice, InvoiceStatus, KYCRecord, Notification, NotificationType } from './types';

interface InvoiceStoreContextType {
  invoices: Invoice[];
  kycRecords: KYCRecord[];
  notifications: Notification[];
  mintInvoice: (invoice: Omit<Invoice, 'id' | 'status' | 'createdAt'>) => Invoice;
  verifyInvoice: (id: string, txHash?: string) => void;
  fundInvoice: (id: string, investor: string, txHash?: string) => boolean;
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getInvoicesBySupplier: (supplier: string) => Invoice[];
  getInvoicesByBuyer: (buyer: string) => Invoice[];
  getInvoicesByInvestor: (investor: string) => Invoice[];
  approveKYC: (address: string, approvedBy: string) => void;
  isKYCApproved: (address: string) => boolean;
  addNotification: (type: NotificationType, title: string, message: string) => void;
  removeNotification: (id: string) => void;
}

const InvoiceStoreContext = createContext<InvoiceStoreContextType | undefined>(undefined);

let invoiceCounter = 0;

export function InvoiceStoreProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const notification: Notification = { id, type, title, message, timestamp: Date.now() };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const mintInvoice = useCallback((data: Omit<Invoice, 'id' | 'status' | 'createdAt'>) => {
    invoiceCounter++;
    const invoice: Invoice = {
      ...data,
      id: `INV-${String(invoiceCounter).padStart(4, '0')}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setInvoices(prev => [...prev, invoice]);
    addNotification('success', 'Invoice Minted', `Invoice ${invoice.id} created on-chain as Draft`);
    return invoice;
  }, [addNotification]);

  const verifyInvoice = useCallback((id: string, txHash?: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id && inv.status === 'draft') {
        return {
          ...inv,
          status: 'verified' as InvoiceStatus,
          verifiedAt: new Date().toISOString(),
          verifyTxHash: txHash,
        };
      }
      return inv;
    }));
    addNotification('success', 'Invoice Verified', `Invoice ${id} has been verified by buyer`);
  }, [addNotification]);

  const fundInvoice = useCallback((id: string, investor: string, txHash?: string): boolean => {
    // Note: We used to check local kycRecords here, but we now enforce 
    // KYC strictly on-chain via the soroban contract. If we reach this 
    // point, the on-chain transaction has already succeeded.

    setInvoices(prev => prev.map(inv => {
      if (inv.id === id && inv.status === 'verified') {
        return {
          ...inv,
          status: 'funded' as InvoiceStatus,
          fundedAt: new Date().toISOString(),
          investor,
          fundTxHash: txHash,
        };
      }
      return inv;
    }));
    addNotification('success', 'Invoice Funded', `Invoice ${id} funded successfully. Supplier received funds.`);
    return true;
  }, [addNotification]);

  const getInvoicesByStatus = useCallback((status: InvoiceStatus) => {
    return invoices.filter(inv => inv.status === status);
  }, [invoices]);

  const getInvoicesBySupplier = useCallback((supplier: string) => {
    return invoices.filter(inv => inv.supplier === supplier);
  }, [invoices]);

  const getInvoicesByBuyer = useCallback((buyer: string) => {
    return invoices.filter(inv => inv.buyer === buyer);
  }, [invoices]);

  const getInvoicesByInvestor = useCallback((investor: string) => {
    return invoices.filter(inv => inv.investor === investor);
  }, [invoices]);

  const approveKYC = useCallback((address: string, approvedBy: string) => {
    setKycRecords(prev => {
      const existing = prev.find(r => r.address === address);
      if (existing) {
        return prev.map(r => r.address === address ? { ...r, approved: true, approvedAt: new Date().toISOString(), approvedBy } : r);
      }
      return [...prev, { address, approved: true, approvedAt: new Date().toISOString(), approvedBy }];
    });
    addNotification('success', 'KYC Approved', `Investor ${address.slice(0, 8)}...${address.slice(-4)} has been approved`);
  }, [addNotification]);

  const isKYCApproved = useCallback((address: string) => {
    return kycRecords.some(r => r.address === address && r.approved);
  }, [kycRecords]);

  return (
    <InvoiceStoreContext.Provider value={{
      invoices,
      kycRecords,
      notifications,
      mintInvoice,
      verifyInvoice,
      fundInvoice,
      getInvoicesByStatus,
      getInvoicesBySupplier,
      getInvoicesByBuyer,
      getInvoicesByInvestor,
      approveKYC,
      isKYCApproved,
      addNotification,
      removeNotification,
    }}>
      {children}
    </InvoiceStoreContext.Provider>
  );
}

export function useInvoiceStore() {
  const context = useContext(InvoiceStoreContext);
  if (context === undefined) {
    throw new Error('useInvoiceStore must be used within an InvoiceStoreProvider');
  }
  return context;
}
