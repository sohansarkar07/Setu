'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import {
  LayoutDashboard, FileText, ClipboardCheck, TrendingUp,
  Briefcase, Shield, Wallet, LogOut, Menu, X,
  ChevronRight, Copy, ExternalLink, CheckCircle, AlertCircle, Send
} from 'lucide-react';
import { shortenAddress, formatXLM } from '@/lib/stellar';

const navItems = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/mint', label: 'Mint Invoice', icon: FileText },
  { href: '/app/requests', label: 'Pending Requests', icon: ClipboardCheck },
  { href: '/app/marketplace', label: 'Marketplace', icon: TrendingUp },
  { href: '/app/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/app/send', label: 'Send XLM', icon: Send },
  { href: '/app/admin', label: 'Admin', icon: Shield },
];

function NotificationToast() {
  const { notifications, removeNotification } = useInvoiceStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="glass-elevated rounded-xl p-4 max-w-sm animate-slide-in-right"
          style={{
            borderLeft: `3px solid ${
              notif.type === 'success' ? 'var(--neon-green)' :
              notif.type === 'error' ? 'var(--danger)' :
              notif.type === 'warning' ? 'var(--warning)' :
              'var(--neon-cyan)'
            }`,
          }}
          onClick={() => removeNotification(notif.id)}
        >
          <div className="flex items-start gap-3">
            {notif.type === 'success' ? (
              <CheckCircle size={18} style={{ color: 'var(--neon-green)', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertCircle size={18} style={{ color: notif.type === 'error' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              <div className="text-sm font-semibold mb-0.5">{notif.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{notif.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isConnected, isConnecting, publicKey, xlmBalance, connect, disconnect, shortenedAddress } = useWallet();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) return null;

  const currentNav = navItems.find(n => n.href === pathname);
  const PageIcon = currentNav?.icon || LayoutDashboard;

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Background dot pattern */}
      <div className="fixed inset-0 dot-bg opacity-30 pointer-events-none" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, var(--bg-secondary), rgba(10, 10, 10, 0.8))',
          borderRight: '1px solid var(--border-primary)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 shrink-0 relative">
          <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-black text-sm transition-transform duration-300 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--neon-green), #2bcc10)', boxShadow: '0 0 15px var(--neon-green-glow-strong)' }}
            >
              S
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Setu</span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            onClick={() => setSidebarOpen(false)}
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Connection status */}
        <div className="px-5 py-6">
          {isConnected ? (
            <div className="p-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_var(--neon-green-glow)]" style={{ background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.08), rgba(57, 255, 20, 0.02))', border: '1px solid rgba(57, 255, 20, 0.15)' }}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="status-dot status-dot-active" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--neon-green)' }}>Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                  {shortenedAddress}
                </span>
                <button onClick={copyAddress} className="p-1.5 rounded-md hover:bg-[rgba(57,255,20,0.1)] transition-colors" style={{ color: 'var(--text-muted)' }} title="Copy Address">
                  {copied ? <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.08), rgba(255, 68, 68, 0.02))', border: '1px solid rgba(255, 68, 68, 0.15)' }}>
              <div className="flex items-center gap-2.5">
                <span className="status-dot status-dot-inactive" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Not Connected</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-2 pb-6">
          <div className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-3" style={{ color: 'var(--text-muted)' }}>
            Main Menu
          </div>
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link animate-fade-in-up ${isActive ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={isActive ? 'text-[var(--neon-green)]' : 'text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]'} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto opacity-70" style={{ color: 'var(--neon-green)' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-5 space-y-4 relative shrink-0">
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />
          
          {isConnected ? (
            <>
              <div className="p-4 rounded-xl inner-card">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={12} style={{ color: 'var(--text-muted)' }} />
                  <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Balance</div>
                </div>
                <div className="text-xl font-bold neon-text-subtle truncate" title={`${formatXLM(String(xlmBalance))} XLM`}>
                  {formatXLM(String(xlmBalance))} <span className="text-sm font-medium opacity-50">XLM</span>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:translate-y-[-1px]"
                style={{
                  color: 'var(--danger)',
                  background: 'rgba(255, 68, 68, 0.08)',
                  border: '1px solid rgba(255, 68, 68, 0.2)',
                  boxShadow: '0 4px 12px rgba(255, 68, 68, 0.05)',
                }}
              >
                <LogOut size={16} />
                Disconnect Wallet
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-neon w-full flex items-center justify-center gap-2 py-3.5 shadow-lg"
            >
              <Wallet size={18} />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <header
          className="h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 glass z-20"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]"
              onClick={() => setSidebarOpen(true)}
              style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}
            >
              <Menu size={20} />
            </button>

            <div className="hidden lg:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                <PageIcon size={16} style={{ color: 'var(--neon-green)' }} />
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {currentNav?.label || 'Dashboard'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {isConnected && publicKey && (
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-[var(--text-primary)] no-underline px-3 py-1.5 rounded-md hover:bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.05)]"
                style={{ color: 'var(--text-muted)' }}
              >
                Explorer <ExternalLink size={12} />
              </a>
            )}
            <div className="badge badge-neon px-3 py-1.5 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              <span className="status-dot status-dot-active" />
              Stellar Testnet
            </div>
          </div>
        </header>

        {/* Page content with entrance animation */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth relative">
          <div className="animate-fade-in-up w-full h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Notifications */}
      <NotificationToast />
    </div>
  );
}
