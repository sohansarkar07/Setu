'use client';

import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { shortenAddress } from '@/lib/stellar';
import {
  Briefcase, FileText, CheckCircle, DollarSign,
  TrendingUp, AlertCircle, Wallet, ArrowUpRight, Zap,
  Activity, ExternalLink, Coins
} from 'lucide-react';

export default function PortfolioPage() {
  const { isConnected, publicKey, connect, isConnecting } = useWallet();
  const { invoices } = useInvoiceStore();

  const mySupplied = publicKey ? invoices.filter(inv => inv.supplier === publicKey) : [];
  const myInvested = publicKey ? invoices.filter(inv => inv.investor === publicKey) : [];
  const allInvoices = invoices;

  const totalSupplied = mySupplied.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvested = myInvested.reduce((sum, inv) => sum + inv.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return 'badge-warning';
      case 'verified': return 'badge-cyan';
      case 'funded': return 'badge-neon';
      case 'defaulted': return 'badge-danger';
      default: return 'badge-neon';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <h1>Portfolio</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Track your minted invoices and investments across the platform.
        </p>
      </div>

      {/* Wallet alert */}
      {!isConnected && (
        <div className="alert-banner alert-warning flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to view your personalized portfolio.</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center gap-2 px-6">
            <Wallet size={16} /> Connect
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <div className="card p-6 card-glow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--text-primary), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
              <FileText size={18} style={{ color: 'var(--text-primary)' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>My Invoices</span>
          </div>
          <div className="text-3xl font-black relative z-10" style={{ color: 'var(--text-primary)' }}>{mySupplied.length}</div>
        </div>
        
        <div className="card p-6 card-accent-green relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--neon-green), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.15)] text-[var(--neon-green)]">
              <DollarSign size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Supplied</span>
          </div>
          <div className="text-3xl font-black neon-text-subtle relative z-10">{totalSupplied.toLocaleString()}</div>
        </div>
        
        <div className="card p-6 card-accent-cyan relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--neon-cyan), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.15)] text-[var(--neon-cyan)]">
              <TrendingUp size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Investments</span>
          </div>
          <div className="text-3xl font-black relative z-10" style={{ color: 'var(--neon-cyan)', textShadow: '0 0 15px rgba(0,240,255,0.3)' }}>{myInvested.length}</div>
        </div>
        
        <div className="card p-6 card-accent-purple relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--neon-purple), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(191,90,242,0.1)] border border-[rgba(191,90,242,0.15)] text-[var(--neon-purple)]">
              <Zap size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Invested</span>
          </div>
          <div className="text-3xl font-black relative z-10" style={{ color: 'var(--neon-purple)', textShadow: '0 0 15px rgba(191,90,242,0.3)' }}>{totalInvested.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* All Invoices Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} style={{ color: 'var(--text-primary)' }} />
              Platform Activity
            </h2>
          </div>

          <div className="card p-0 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            {allInvoices.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-50" />
                <div className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No invoices found</div>
                <div className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  There is currently no invoice activity on the platform. Mint an invoice to get started.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-neon whitespace-nowrap">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Amount (XLM)</th>
                      <th>Parties</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Explorer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInvoices.map((inv) => (
                      <tr key={inv.id} className="group">
                        <td>
                          <span className="font-mono text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{inv.id.slice(-6)}</span>
                        </td>
                        <td>
                          <span className="text-sm font-semibold">{inv.description || '—'}</span>
                        </td>
                        <td>
                          <span className="text-sm font-bold font-mono">{inv.amount.toLocaleString()}</span>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span style={{ color: 'var(--text-muted)' }}>S:</span> {shortenAddress(inv.supplier, 4)}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span style={{ color: 'var(--text-muted)' }}>B:</span> {shortenAddress(inv.buyer, 4)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm">{inv.dueDate}</span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(inv.status)}`}>
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </span>
                        </td>
                        <td>
                        {inv.fundTxHash && /^[0-9a-fA-F]{64}$/.test(inv.fundTxHash) ? (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${inv.fundTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(0,240,255,0.1)] border border-transparent hover:border-[rgba(0,240,255,0.2)]"
                              style={{ color: 'var(--text-muted)' }}
                              title="View on Stellar Expert"
                            >
                              <ExternalLink size={14} className="group-hover:text-[var(--neon-cyan)] transition-colors" />
                            </a>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* My Investments */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={20} style={{ color: 'var(--neon-cyan)' }} />
            My Investments
          </h2>
          
          <div className="space-y-4">
            {myInvested.length === 0 ? (
              <div className="card p-10 text-center relative overflow-hidden" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="empty-state-icon mb-4">
                  <Coins size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="text-sm font-bold mb-1">No Investments</div>
                <div className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>You haven&apos;t funded any invoices yet.</div>
                <a href="/app/marketplace" className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5" style={{ color: 'var(--neon-cyan)', borderColor: 'rgba(0,240,255,0.3)' }}>
                  Browse Marketplace
                </a>
              </div>
            ) : (
              myInvested.map((inv) => (
                <div
                  key={inv.id}
                  className="card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{ border: '1px solid rgba(0,240,255,0.15)' }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ background: 'radial-gradient(circle at top right, var(--neon-cyan), transparent 70%)' }} />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.15)]" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.2)' }}>
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold line-clamp-1" title={inv.description}>{inv.description || `Invoice ${inv.id.slice(-4)}`}</div>
                        <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Funded {inv.fundedAt ? new Date(inv.fundedAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] mb-3 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Principal</div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Expected Return</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold font-mono">{inv.amount.toLocaleString()} XLM</div>
                      <div className="text-sm font-bold font-mono" style={{ color: 'var(--neon-green)' }}>{(inv.amount * 1.085).toLocaleString(undefined, {maximumFractionDigits: 1})} XLM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs relative z-10">
                    <span style={{ color: 'var(--text-muted)' }}>Due: <span className="font-semibold text-[var(--text-primary)]">{inv.dueDate}</span></span>
                    {inv.fundTxHash && /^[0-9a-fA-F]{64}$/.test(inv.fundTxHash) ? (
                      <a href={`https://stellar.expert/explorer/testnet/tx/${inv.fundTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--neon-cyan)' }}>
                        View Tx <ArrowUpRight size={10} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }} className="text-xs">Tx Pending</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
