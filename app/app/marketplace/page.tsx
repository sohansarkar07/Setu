'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { shortenAddress } from '@/lib/stellar';
import { fundInvoiceOnChain } from '@/lib/soroban';
import {
  TrendingUp, Shield, Wallet, AlertCircle, Coins,
  Clock, CheckCircle, Loader2, DollarSign, Activity,
  Briefcase
} from 'lucide-react';

export default function MarketplacePage() {
  const { isConnected, publicKey, connect, isConnecting, xlmBalance } = useWallet();
  const { invoices, fundInvoice, addNotification } = useInvoiceStore();
  
  const [fundingId, setFundingId] = useState<string | null>(null);

  // In a real app, check if publicKey is in KYC list
  // For demo, we assume KYC is approved if connected
  const isKycApproved = isConnected;

  // Show only verified invoices in marketplace
  const availableInvoices = invoices.filter(inv => inv.status === 'verified');

  const handleFund = async (invoiceId: string, amount: number) => {
    if (!publicKey) return;
    
    // Check balance (demo logic)
    if (xlmBalance < amount) {
      addNotification('error', 'Insufficient Funds', 'You do not have enough XLM to fund this invoice.');
      return;
    }

    setFundingId(invoiceId);

    try {
      // Find invoice to get supplier address
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Real on-chain funding
      const numericId = parseInt(invoiceId.replace('INV-', ''));
      const txHash = await fundInvoiceOnChain(publicKey, BigInt(numericId));

      fundInvoice(invoiceId, publicKey, txHash);
      addNotification(
        'success',
        'Investment Successful',
        `You have successfully funded invoice ${invoiceId}. Asset transferred to supplier.`
      );
    } catch (error) {
      console.error(error);
      addNotification('error', 'Funding Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setFundingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1>Marketplace</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Invest in verified RWA invoices and earn yield.
          </p>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[rgba(191,90,242,0.15)] text-[var(--neon-purple)]">
              <Shield size={12} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>KYC Status</div>
              <div className="text-xs font-bold" style={{ color: isKycApproved ? 'var(--neon-green)' : 'var(--warning)' }}>
                {isKycApproved ? 'Verified & Active' : 'Action Required'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {!isConnected ? (
        <div className="alert-banner alert-warning flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to browse and invest in the marketplace.</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center gap-2">
            <Wallet size={16} /> Connect
          </button>
        </div>
      ) : !isKycApproved ? (
        <div className="alert-banner alert-warning flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>KYC Required</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>You must complete KYC before investing.</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {[
          { label: 'Available Supply', value: availableInvoices.reduce((acc, inv) => acc + inv.amount, 0).toLocaleString(), icon: Coins, color: 'var(--neon-cyan)' },
          { label: 'Active Opportunities', value: availableInvoices.length.toString(), icon: Activity, color: 'var(--neon-purple)' },
          { label: 'Avg. Yield (APR)', value: '8.5%', icon: TrendingUp, color: 'var(--neon-green)' },
          { label: 'Default Rate', value: '0.0%', icon: Shield, color: 'var(--text-primary)' },
        ].map((stat, i) => (
          <div key={i} className="card p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${stat.color}, transparent 70%)` }} />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color === 'var(--text-primary)' ? 'var(--text-primary)' : 'var(--text-primary)', textShadow: stat.color !== 'var(--text-primary)' ? `0 0 10px ${stat.color}40` : 'none' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Listings */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Briefcase size={20} style={{ color: 'var(--text-primary)' }} />
          Live Opportunities
        </h2>

        {availableInvoices.length === 0 ? (
          <div className="card p-16 text-center animate-fade-in-up card-glow" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="empty-state-icon mb-6">
              <TrendingUp size={36} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-xl font-bold mb-2">No Active Listings</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              There are currently no verified invoices available for funding in the marketplace. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
            {availableInvoices.map((inv) => (
              <div
                key={inv.id}
                className="card p-0 overflow-hidden flex flex-col group card-glow transition-all duration-300 hover:-translate-y-1"
                style={{ border: '1px solid rgba(191,90,242,0.15)' }}
              >
                {/* Top accent */}
                <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--neon-purple), transparent)' }} />
                
                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="badge badge-cyan mb-3">
                        <CheckCircle size={12} /> Verified
                      </div>
                      <h3 className="text-lg font-bold mb-1 line-clamp-1" title={inv.description}>{inv.description || 'Verified Invoice'}</h3>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>ID: {inv.id}</div>
                    </div>
                  </div>

                  {/* Funding amount */}
                  <div className="mb-6 p-4 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)]">
                    <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Target Amount</div>
                    <div className="text-2xl font-black neon-text-subtle" style={{ color: 'var(--neon-purple)', textShadow: '0 0 15px rgba(191,90,242,0.4)' }}>
                      {inv.amount.toLocaleString()} <span className="text-sm font-normal opacity-50">XLM</span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-8">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Expected Yield</div>
                      <div className="text-sm font-bold text-green-400">~8.5% APR</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Due Date</div>
                      <div className="text-sm font-bold flex items-center gap-1.5"><Clock size={12} className="opacity-70" /> {inv.dueDate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Supplier</div>
                      <div className="text-xs font-mono">{shortenAddress(inv.supplier)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Buyer Rating</div>
                      <div className="text-sm font-bold flex items-center gap-1 text-yellow-500">
                        A+ <Shield size={12} />
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-auto pt-5 border-t border-[rgba(255,255,255,0.05)]">
                    <button
                      onClick={() => handleFund(inv.id, inv.amount)}
                      disabled={fundingId === inv.id || !isConnected || !isKycApproved || xlmBalance < inv.amount}
                      className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-[0_0_20px_rgba(191,90,242,0.15)] hover:shadow-[0_0_30px_rgba(191,90,242,0.25)] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
                      style={{ background: 'linear-gradient(135deg, rgba(191,90,242,0.15), rgba(191,90,242,0.05))', color: 'var(--neon-purple)', border: '1px solid rgba(191,90,242,0.3)' }}
                    >
                      {fundingId === inv.id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign size={18} />
                          Fund Invoice
                        </>
                      )}
                    </button>
                    {!isKycApproved && isConnected && (
                      <p className="text-[10px] text-center mt-2 text-red-400">KYC required to fund</p>
                    )}
                    {isConnected && xlmBalance < inv.amount && isKycApproved && (
                      <p className="text-[10px] text-center mt-2 text-yellow-500">Insufficient XLM balance</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
