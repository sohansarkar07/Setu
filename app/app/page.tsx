'use client';

import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { formatXLM, shortenAddress } from '@/lib/stellar';
import Link from 'next/link';
import {
  FileText, ClipboardCheck, TrendingUp, CheckCircle,
  ArrowRight, Wallet, Zap, Shield, Users, Clock,
  ArrowUpRight, AlertCircle, Coins, Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { isConnected, publicKey, xlmBalance, connect, isConnecting } = useWallet();
  const { invoices } = useInvoiceStore();

  const totalInvoices = invoices.length;
  const pendingApprovals = invoices.filter(inv => inv.status === 'draft').length;
  const activeAuctions = invoices.filter(inv => inv.status === 'verified').length;
  const funded = invoices.filter(inv => inv.status === 'funded').length;

  const recentInvoices = [...invoices].reverse().slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Page header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isConnected ? `Welcome back, ${shortenAddress(publicKey || '')}` : 'Connect your wallet to get started'}
        </p>
      </div>

      {/* Wallet alert */}
      {!isConnected && (
        <div className="alert-banner alert-warning flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,170,0,0.1)] border border-[rgba(255,170,0,0.2)] text-[var(--warning)]">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Connect your Freighter wallet to interact with the platform</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center gap-2 px-6">
            <Wallet size={16} />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {[
          { label: 'Total Invoices', value: totalInvoices, icon: FileText, color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.05)' },
          { label: 'Pending Approvals', value: pendingApprovals, icon: ClipboardCheck, color: 'var(--warning)', bg: 'rgba(255,170,0,0.05)' },
          { label: 'Active Auctions', value: activeAuctions, icon: TrendingUp, color: 'var(--neon-cyan)', bg: 'rgba(0,240,255,0.05)' },
          { label: 'Successfully Funded', value: funded, icon: CheckCircle, color: 'var(--neon-green)', bg: 'rgba(57,255,20,0.05)' },
        ].map((stat, i) => (
          <div key={i} className="card p-6 card-glow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 group-hover:opacity-40 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${stat.color}, transparent 70%)`, mixBlendMode: 'screen' }} />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg, color: stat.color, border: `1px solid ${stat.color}30` }}>
                <stat.icon size={18} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]" style={{ color: 'var(--text-secondary)' }}>
                Stat
              </span>
            </div>
            
            <div className="relative z-10">
              <div className="stat-number mb-1" style={{ color: stat.color, fontSize: '2.5rem', background: 'none', WebkitTextFillColor: 'initial' }}>
                {stat.value}
              </div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {/* Supplier */}
        <div className="card card-accent-green p-7 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-40 h-40 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <Zap size={160} style={{ color: 'var(--neon-green)' }} />
          </div>
          
          <div className="flex flex-col h-full relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--neon-green-subtle)', color: 'var(--neon-green)', border: '1px solid rgba(57,255,20,0.2)' }}>
                <FileText size={20} />
              </div>
              <span className="text-lg font-bold">Supplier</span>
            </div>
            
            <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Turn your unpaid invoices into instant liquidity. Tokenize your receivables on-chain.
            </p>
            
            <div className="mt-auto">
              <Link href="/app/mint" className="btn-neon w-full flex items-center justify-center gap-2 no-underline text-sm font-bold shadow-[0_0_20px_rgba(57,255,20,0.15)]">
                Mint Invoice <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Buyer */}
        <div className="card card-accent-cyan p-7 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-40 h-40 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <Shield size={160} style={{ color: 'var(--neon-cyan)' }} />
          </div>
          
          <div className="flex flex-col h-full relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.2)' }}>
                <ClipboardCheck size={20} />
              </div>
              <span className="text-lg font-bold">Buyer</span>
            </div>
            
            <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Review and approve supplier invoices cryptographically. Build supply chain trust.
            </p>
            
            <div className="mt-auto">
              <Link
                href="/app/requests"
                className="w-full flex items-center justify-center gap-2 no-underline text-sm py-3 rounded-xl font-bold transition-all hover:bg-[rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:-translate-y-0.5"
                style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0, 240, 255, 0.25)' }}
              >
                Review Requests <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Investor */}
        <div className="card card-accent-purple p-7 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-40 h-40 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <TrendingUp size={160} style={{ color: 'var(--neon-purple)' }} />
          </div>
          
          <div className="flex flex-col h-full relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(191,90,242,0.2)' }}>
                <Coins size={20} />
              </div>
              <span className="text-lg font-bold">Investor</span>
            </div>
            
            <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Provide liquidity by investing in verified invoices and earn decentralized yield.
            </p>
            
            <div className="mt-auto">
              <Link
                href="/app/marketplace"
                className="w-full flex items-center justify-center gap-2 no-underline text-sm py-3 rounded-xl font-bold transition-all hover:bg-[rgba(191,90,242,0.2)] hover:shadow-[0_0_20px_rgba(191,90,242,0.15)] hover:-translate-y-0.5"
                style={{ background: 'rgba(191, 90, 242, 0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(191, 90, 242, 0.25)' }}
              >
                Browse Market <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity / Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent invoices */}
        <div className="lg:col-span-2 card p-7">
          <div className="flex items-center justify-between mb-6 border-b border-[rgba(255,255,255,0.05)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                <Activity size={16} style={{ color: 'var(--text-primary)' }} />
              </div>
              <h3 className="text-lg font-bold">Recent Invoices</h3>
            </div>
            <Link href="/app/portfolio" className="text-sm font-semibold flex items-center gap-1 no-underline px-3 py-1.5 rounded-lg hover:bg-[rgba(57,255,20,0.1)] transition-colors" style={{ color: 'var(--neon-green)' }}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="empty-state-icon mb-6">
                <FileText size={32} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No invoices yet</div>
              <div className="text-sm mb-6 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Create your first invoice to get started on the Setu platform.
              </div>
              <Link href="/app/mint" className="btn-neon text-sm px-6 py-3 no-underline inline-flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.15)]">
                <FileText size={16} /> Mint First Invoice
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] group cursor-default"
                  style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-110" style={{ background: 'var(--neon-green-subtle)', color: 'var(--neon-green)', border: '1px solid rgba(57,255,20,0.15)' }}>
                      {inv.id.slice(-2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{inv.description || inv.id}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{shortenAddress(inv.supplier)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold mb-1">{inv.amount.toLocaleString()} <span className="text-xs opacity-50 font-normal">XLM</span></div>
                    <span
                      className={`badge text-[10px] uppercase tracking-wider ${
                        inv.status === 'draft' ? 'badge-warning' :
                        inv.status === 'verified' ? 'badge-cyan' :
                        inv.status === 'funded' ? 'badge-neon' :
                        'badge-danger'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet info */}
        <div className="card p-7 card-accent-green h-full">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.05)] pb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.15)]">
              <Wallet size={16} style={{ color: 'var(--neon-green)' }} />
            </div>
            <h3 className="text-lg font-bold">Wallet Profile</h3>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl inner-card">
                <div className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Coins size={12} /> Balance
                </div>
                <div className="text-3xl font-black mb-1 tracking-tight neon-text-subtle">{formatXLM(String(xlmBalance))}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--neon-green)' }}>Stellar Testnet</div>
              </div>
              
              <div className="p-4 rounded-xl inner-card">
                <div className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Shield size={12} /> Address
                </div>
                <div className="text-xs font-mono break-all leading-relaxed p-3 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)]" style={{ color: 'var(--text-primary)' }}>
                  {publicKey}
                </div>
              </div>
              
              <div className="p-4 rounded-xl inner-card flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Network Status</div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.2)]">
                  <span className="status-dot status-dot-active" />
                  <span className="text-xs font-bold" style={{ color: 'var(--neon-green)' }}>Online</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="empty-state-icon mb-6">
                <Wallet size={32} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Not Connected</div>
              <div className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Connect your Freighter wallet to view your balance and address profile.</div>
              <button onClick={connect} className="btn-neon text-sm px-8 py-3 w-full shadow-[0_0_20px_rgba(57,255,20,0.15)]">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
