'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { addKYC, removeKYC, shortenAddress } from '@/lib/stellar';
import {
  Shield, UserCheck, UserX, Loader2, Plus, Users, Wallet,
  AlertCircle, CheckCircle, ExternalLink, Lock
} from 'lucide-react';

export default function AdminPage() {
  const { isConnected, publicKey, connect, isConnecting } = useWallet();
  const { addNotification } = useInvoiceStore();
  
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'remove' | null>(null);

  // Mock list of KYC'd addresses for demo
  const [kycList, setKycList] = useState([
    { address: 'GBX7V...9Q2A', addedAt: '2023-10-01T12:00:00.000Z', status: 'active' },
    { address: 'GAT3C...4M1B', addedAt: '2023-09-28T12:00:00.000Z', status: 'active' },
  ]);

  const handleAction = async (action: 'add' | 'remove') => {
    if (!publicKey) return;
    if (!address || address.length < 10) {
      addNotification('error', 'Validation Error', 'Please enter a valid Stellar address');
      return;
    }

    setIsLoading(true);
    setActionType(action);

    try {
      let result;
      if (action === 'add') {
        result = await addKYC(publicKey, address, `SETU-KYC-ADD-${Date.now()}`);
      } else {
        result = await removeKYC(publicKey, address, `SETU-KYC-RM-${Date.now()}`);
      }

      if (result.success) {
        addNotification(
          'success',
          action === 'add' ? 'KYC Added' : 'KYC Removed',
          `Successfully ${action === 'add' ? 'authorized' : 'revoked'} address on-chain.`
        );
        
        // Update mock list
        if (action === 'add') {
          setKycList([{ address: shortenAddress(address), addedAt: new Date().toISOString(), status: 'active' }, ...kycList]);
        }
        
        setAddress('');
      } else {
        addNotification('error', 'Action Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      addNotification('error', 'Transaction Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Admin Panel</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage platform settings and KYC authorizations.
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-neon shadow-[0_0_20px_rgba(191,90,242,0.2)]" style={{ background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.3)', color: 'var(--neon-purple)' }}>
          <Shield size={28} />
        </div>
      </div>

      {/* Wallet alert */}
      {!isConnected && (
        <div className="alert-banner alert-warning flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Connect your admin wallet to manage KYC records.</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center gap-2">
            <Wallet size={16} /> Connect
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 stagger-children">
        {/* Manage KYC Form */}
        <div className="card p-7 card-accent-purple relative overflow-hidden group h-full">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--neon-purple), transparent 70%)', mixBlendMode: 'screen' }} />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.1)', color: 'var(--neon-purple)' }}>
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Manage KYC</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Authorize investors to participate</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="form-label">Investor Address</label>
              <input
                type="text"
                className="input-neon font-mono text-sm"
                placeholder="G..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <p className="form-hint">
                Adding an address allows it to hold the Setu Token (sUSDC) via AUTHORIZATION_REQUIRED.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <button
                onClick={() => handleAction('add')}
                disabled={isLoading || !isConnected || !address}
                className="btn-outline flex items-center justify-center gap-2 py-3"
                style={{ borderColor: 'rgba(191,90,242,0.5)', color: 'var(--neon-purple)' }}
              >
                {isLoading && actionType === 'add' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserCheck size={16} />
                )}
                Authorize
              </button>
              
              <button
                onClick={() => handleAction('remove')}
                disabled={isLoading || !isConnected || !address}
                className="btn-outline flex items-center justify-center gap-2 py-3"
                style={{ borderColor: 'rgba(255,68,68,0.5)', color: 'var(--danger)' }}
              >
                {isLoading && actionType === 'remove' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserX size={16} />
                )}
                Revoke
              </button>
            </div>
          </div>
        </div>

        {/* KYC Records */}
        <div className="card p-0 flex flex-col h-full" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between bg-[rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3">
              <Users size={18} style={{ color: 'var(--text-primary)' }} />
              <h2 className="text-lg font-bold">Recent KYC Records</h2>
            </div>
            <div className="text-xs font-mono px-2 py-1 rounded bg-[rgba(255,255,255,0.05)]" style={{ color: 'var(--text-muted)' }}>
              {kycList.length} Active
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {kycList.map((record, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.2)]">
                    <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{record.address}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Added {new Date(record.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="badge badge-neon" style={{ background: 'rgba(191,90,242,0.1)', color: 'var(--neon-purple)', borderColor: 'rgba(191,90,242,0.2)' }}>
                  Active
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trustline Info */}
      <div className="card p-6 card-glow flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.1)]" style={{ background: 'var(--neon-green-subtle)', color: 'var(--neon-green)' }}>
          <Shield size={24} />
        </div>
        <div>
          <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>AUTHORIZATION_REQUIRED</h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The Setu Token (sUSDC) uses the <code>AUTHORIZATION_REQUIRED</code> flag on Stellar. This means investors cannot hold or transact with the token until an admin explicitly signs an <code>AllowTrust</code> operation for their account.
          </p>
        </div>
      </div>
    </div>
  );
}
