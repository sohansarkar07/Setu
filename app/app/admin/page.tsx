'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { shortenAddress } from '@/lib/stellar';
import { approveKYCOnChain, revokeKYCOnChain } from '@/lib/soroban';
import {
  Shield, UserCheck, UserX, Loader2, Users, Wallet,
  CheckCircle, Lock, Crown, UserPlus, Trash2,
  ExternalLink
} from 'lucide-react';

// ── Super-admin (you). This can never be removed. ──────────────────────────────
const SUPER_ADMIN = 'GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF';

export default function AdminPage() {
  const { isConnected, publicKey, connect, isConnecting } = useWallet();
  const { addNotification } = useInvoiceStore();

  // KYC state
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'remove' | null>(null);
  const [kycList, setKycList] = useState<{ address: string; addedAt: string }[]>([]);

  // Admin management state
  const [adminList, setAdminList] = useState<{ address: string; addedAt: string; addedBy: string }[]>([
    { address: SUPER_ADMIN, addedAt: new Date().toISOString(), addedBy: 'genesis' },
  ]);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // ── Access checks ────────────────────────────────────────────────────────────
  const isSuperAdmin = publicKey === SUPER_ADMIN;
  const isAdmin = adminList.some(a => a.address === publicKey);

  // ── KYC Handlers ────────────────────────────────────────────────────────────
  const handleKYCAction = async (action: 'add' | 'remove') => {
    if (!publicKey || !isAdmin) return;
    if (!address || address.length < 10) {
      addNotification('error', 'Validation Error', 'Please enter a valid Stellar address');
      return;
    }

    setIsLoading(true);
    setActionType(action);

    try {
      let txHash: string;
      if (action === 'add') {
        txHash = await approveKYCOnChain(publicKey, address);
        addNotification('success', 'KYC Approved On-Chain', `Investor ${shortenAddress(address)} approved. Tx: ${txHash.slice(0, 8)}...`);
        setKycList(prev => [{ address, addedAt: new Date().toISOString() }, ...prev]);
      } else {
        txHash = await revokeKYCOnChain(publicKey, address);
        addNotification('success', 'KYC Revoked On-Chain', `Investor ${shortenAddress(address)} revoked. Tx: ${txHash.slice(0, 8)}...`);
        setKycList(prev => prev.filter(r => r.address !== address));
      }
      setAddress('');
    } catch (error) {
      addNotification('error', 'Transaction Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // ── Admin Management Handlers (super-admin only) ─────────────────────────────
  const handleAddAdmin = () => {
    if (!isSuperAdmin) return;
    if (!newAdminAddress || newAdminAddress.length < 10) {
      addNotification('error', 'Invalid Address', 'Please enter a valid Stellar G... address');
      return;
    }
    if (adminList.some(a => a.address === newAdminAddress)) {
      addNotification('warning', 'Already Admin', 'This address is already an admin');
      return;
    }

    setIsAddingAdmin(true);
    setTimeout(() => {
      setAdminList(prev => [...prev, {
        address: newAdminAddress,
        addedAt: new Date().toISOString(),
        addedBy: publicKey!,
      }]);
      addNotification('success', 'Admin Added', `${shortenAddress(newAdminAddress)} is now a platform admin`);
      setNewAdminAddress('');
      setIsAddingAdmin(false);
    }, 800);
  };

  const handleRemoveAdmin = (adminAddress: string) => {
    if (!isSuperAdmin) return;
    if (adminAddress === SUPER_ADMIN) {
      addNotification('error', 'Cannot Remove', 'The super-admin cannot be removed');
      return;
    }
    setAdminList(prev => prev.filter(a => a.address !== adminAddress));
    addNotification('info', 'Admin Removed', `${shortenAddress(adminAddress)} admin access revoked`);
  };

  // ── Access Denied screen ─────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="card p-12 card-accent-purple space-y-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.3)', color: 'var(--neon-purple)' }}>
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold">Admin Access Required</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Connect your authorized admin wallet to proceed.</p>
          <button onClick={connect} disabled={isConnecting} className="btn-neon mx-auto flex items-center gap-2">
            <Wallet size={18} /> Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="card p-12 space-y-6" style={{ border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.03)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: 'var(--danger)' }}>
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your connected wallet is not authorized to access the admin panel.
          </p>
          <div className="p-3 rounded-xl text-xs font-mono text-left break-all" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>
            Connected: {publicKey}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Contact the super-admin to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Admin Panel</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage KYC authorizations and platform administrators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: 'var(--warning)' }}>
              <Crown size={14} /> Super Admin
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.3)', color: 'var(--neon-purple)' }}>
            <Shield size={14} /> Admin
          </div>
        </div>
      </div>

      {/* Logged in as */}
      <div className="p-4 rounded-xl text-xs font-mono flex items-center gap-3" style={{ background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.12)' }}>
        <CheckCircle size={14} style={{ color: 'var(--neon-green)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-muted)' }}>Authenticated as:</span>
        <span style={{ color: 'var(--text-primary)' }}>{publicKey}</span>
        <a href={`https://stellar.expert/explorer/testnet/account/${publicKey}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-cyan)', marginLeft: 'auto', flexShrink: 0 }}>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* KYC Management */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* KYC Form */}
        <div className="card p-7 card-accent-purple relative overflow-hidden group h-full">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--neon-purple), transparent 70%)' }} />
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
              <label className="form-label">Investor Stellar Address</label>
              <input
                type="text"
                className="input-neon font-mono text-sm"
                placeholder="G..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <p className="form-hint">Grants/revokes the investor ability to fund invoices on-chain.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <button
                onClick={() => handleKYCAction('add')}
                disabled={isLoading || !address}
                className="btn-outline flex items-center justify-center gap-2 py-3"
                style={{ borderColor: 'rgba(191,90,242,0.5)', color: 'var(--neon-purple)' }}
              >
                {isLoading && actionType === 'add' ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                Authorize
              </button>
              <button
                onClick={() => handleKYCAction('remove')}
                disabled={isLoading || !address}
                className="btn-outline flex items-center justify-center gap-2 py-3"
                style={{ borderColor: 'rgba(255,68,68,0.5)', color: 'var(--danger)' }}
              >
                {isLoading && actionType === 'remove' ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
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
              <h2 className="text-lg font-bold">KYC Records</h2>
            </div>
            <div className="text-xs font-mono px-2 py-1 rounded bg-[rgba(255,255,255,0.05)]" style={{ color: 'var(--text-muted)' }}>
              {kycList.length} Active
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
            {kycList.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>No KYC records yet</div>
            ) : kycList.map((record, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[rgba(255,255,255,0.05)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)' }}>
                    <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-mono">{shortenAddress(record.address)}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Added {new Date(record.addedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className="badge badge-neon text-xs" style={{ background: 'rgba(57,255,20,0.1)', color: 'var(--neon-green)', borderColor: 'rgba(57,255,20,0.2)' }}>Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Management — super-admin only */}
      {isSuperAdmin && (
        <div className="card p-7 space-y-6" style={{ border: '1px solid rgba(255,170,0,0.2)', background: 'rgba(255,170,0,0.02)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,170,0,0.1)', color: 'var(--warning)', border: '1px solid rgba(255,170,0,0.2)' }}>
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--warning)' }}>Admin Management</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Grant or revoke admin access to other wallets — super-admin only</p>
            </div>
          </div>

          {/* Add Admin */}
          <div className="flex gap-3">
            <input
              type="text"
              className="input-neon font-mono text-sm flex-1"
              placeholder="G... new admin wallet address"
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
            />
            <button
              onClick={handleAddAdmin}
              disabled={isAddingAdmin || !newAdminAddress}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all"
              style={{ background: 'rgba(255,170,0,0.15)', color: 'var(--warning)', border: '1px solid rgba(255,170,0,0.3)' }}
            >
              {isAddingAdmin ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Add Admin
            </button>
          </div>

          {/* Admin List */}
          <div className="space-y-2">
            {adminList.map((admin, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: admin.address === SUPER_ADMIN ? 'rgba(255,170,0,0.15)' : 'rgba(191,90,242,0.1)', border: `1px solid ${admin.address === SUPER_ADMIN ? 'rgba(255,170,0,0.3)' : 'rgba(191,90,242,0.2)'}` }}>
                    {admin.address === SUPER_ADMIN ? <Crown size={14} style={{ color: 'var(--warning)' }} /> : <Shield size={14} style={{ color: 'var(--neon-purple)' }} />}
                  </div>
                  <div>
                    <div className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                      {admin.address === publicKey ? `${admin.address.slice(0, 12)}...${admin.address.slice(-6)} (you)` : `${admin.address.slice(0, 12)}...${admin.address.slice(-6)}`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {admin.address === SUPER_ADMIN ? 'Super Admin · Genesis' : `Added ${new Date(admin.addedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded font-semibold" style={{
                    background: admin.address === SUPER_ADMIN ? 'rgba(255,170,0,0.1)' : 'rgba(191,90,242,0.1)',
                    color: admin.address === SUPER_ADMIN ? 'var(--warning)' : 'var(--neon-purple)',
                    border: `1px solid ${admin.address === SUPER_ADMIN ? 'rgba(255,170,0,0.2)' : 'rgba(191,90,242,0.2)'}`,
                  }}>
                    {admin.address === SUPER_ADMIN ? 'Super' : 'Admin'}
                  </span>
                  {admin.address !== SUPER_ADMIN && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.address)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(255,68,68,0.15)]"
                      style={{ color: 'var(--danger)' }}
                      title="Remove admin"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trustline Info */}
      <div className="card p-6 card-glow flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--neon-green-subtle)', color: 'var(--neon-green)' }}>
          <Shield size={24} />
        </div>
        <div>
          <h4 className="text-base font-bold mb-1">AUTHORIZATION_REQUIRED</h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The Setu Token (sUSDC) uses the <code>AUTHORIZATION_REQUIRED</code> flag on Stellar. Investors cannot hold or transact until an admin explicitly signs an <code>AllowTrust</code> operation for their account.
          </p>
        </div>
      </div>
    </div>
  );
}
