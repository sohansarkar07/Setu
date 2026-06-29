'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { shortenAddress } from '@/lib/stellar';
import { verifyInvoiceOnChain } from '@/lib/soroban';
import {
  ClipboardCheck, AlertCircle, CheckCircle, Wallet,
  ShieldCheck, Loader2, ArrowRight, FileText, User, 
  Calendar, DollarSign
} from 'lucide-react';

export default function RequestsPage() {
  const { isConnected, publicKey, connect, isConnecting } = useWallet();
  const { invoices, verifyInvoice, addNotification } = useInvoiceStore();
  
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // In a real app, we would only show invoices where buyer === publicKey
  // For demo, we show all 'draft' invoices
  const pendingRequests = invoices.filter(inv => inv.status === 'draft');

  const handleVerify = async (invoiceId: string) => {
    if (!publicKey) return;

    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) {
      addNotification('error', 'Error', 'Invoice not found');
      return;
    }

    setVerifyingId(invoiceId);

    try {
      // Use the actual on-chain chain ID stored when minting
      // Fall back to parsing the local ID if chainId wasn't stored
      const onChainId = typeof inv.chainId === 'number' ? inv.chainId : parseInt(invoiceId.replace('INV-', ''), 10);
      
      const txHash = await verifyInvoiceOnChain(publicKey, BigInt(onChainId));

      verifyInvoice(invoiceId, txHash);
      addNotification(
        'success',
        'Verification Complete',
        `Invoice ${invoiceId} has been cryptographically verified on-chain. TX: ${txHash.slice(0, 8)}...`
      );
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Transaction failed';
      addNotification('error', 'Verification Failed', msg);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <h1>Pending Approvals</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Review and verify invoices where you are listed as the buyer.
        </p>
      </div>

      {/* Wallet alert */}
      {!isConnected && (
        <div className="alert-banner alert-warning flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,170,0,0.1)] border border-[rgba(255,170,0,0.2)] text-[var(--warning)] shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Connect your Freighter wallet to verify invoices.</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center justify-center gap-2 px-6 w-full sm:w-auto shrink-0">
            <Wallet size={16} /> Connect
          </button>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4 stagger-children">
        {pendingRequests.length === 0 ? (
          <div className="card p-16 text-center animate-fade-in-up card-glow" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="empty-state-icon mb-6">
              <ShieldCheck size={36} style={{ color: 'var(--neon-cyan)' }} />
            </div>
            <h3 className="text-xl font-bold mb-2">No Pending Requests</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You don&apos;t have any invoices waiting for your approval. When a supplier lists you as a buyer, it will appear here.
            </p>
          </div>
        ) : (
          pendingRequests.map((inv) => (
            <div
              key={inv.id}
              className="card p-0 overflow-hidden group hover:-translate-y-1 transition-all duration-300"
              style={{ border: '1px solid rgba(0,240,255,0.15)' }}
            >
              {/* Card top gradient accent */}
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)' }} />
              
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                
                {/* Left side details */}
                <div className="flex-1 w-full space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(0,240,255,0.1)]" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.2)' }}>
                      {inv.id.slice(-2)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{inv.description || 'Invoice Payment'}</h3>
                      <div className="text-xs uppercase tracking-wider font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>ID: {inv.id}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                        <DollarSign size={12} /> Amount
                      </div>
                      <div className="text-lg font-bold font-mono neon-text-subtle">{inv.amount.toLocaleString()} <span className="text-xs font-normal opacity-50">XLM</span></div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={12} /> Due Date
                      </div>
                      <div className="text-sm font-semibold">{inv.dueDate}</div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                        <User size={12} /> Supplier
                      </div>
                      <div className="text-sm font-mono px-3 py-1.5 rounded-lg inline-block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                        {shortenAddress(inv.supplier)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side action */}
                <div className="w-full md:w-auto shrink-0 md:pl-6 md:border-l border-[rgba(255,255,255,0.05)] flex flex-col items-center justify-center">
                  <div className="text-center mb-4 md:mb-0">
                    <button
                      onClick={() => handleVerify(inv.id)}
                      disabled={verifyingId === inv.id || !isConnected}
                      className="w-full md:w-48 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:-translate-y-1"
                      style={{ 
                        background: 'rgba(0,240,255,0.1)', 
                        color: 'var(--neon-cyan)', 
                        border: '1px solid rgba(0,240,255,0.3)' 
                      }}
                    >
                      {verifyingId === inv.id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          Approve Invoice
                        </>
                      )}
                    </button>
                    <div className="text-[10px] uppercase tracking-widest mt-3 opacity-50" style={{ color: 'var(--neon-cyan)' }}>
                      Cryptographic Signature Required
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Card */}
      <div className="card p-6 card-accent-cyan flex gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)' }}>
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--neon-cyan)' }}>What does approval mean?</h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            By approving an invoice, you cryptographically sign a transaction confirming that the invoice is valid and you intend to pay it by the due date. This creates a &quot;Digital Handshake&quot; that gives investors confidence to fund the supplier immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
