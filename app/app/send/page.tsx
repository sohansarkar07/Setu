'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { sendXLMTransaction, getTransactionHistory } from '@/lib/stellar';
import {
  Send, Wallet, AlertCircle, CheckCircle, Copy, User, DollarSign, FileText, Loader2, Clock, ExternalLink
} from 'lucide-react';

interface TxRecord {
  hash: string;
  createdAt: string;
  successful: boolean;
  memo?: string;
  feeCharged: string;
  sourceAccount: string;
}

export default function SendPage() {
  const { isConnected, publicKey, connect, isConnecting, refreshBalance } = useWallet();

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txResult, setTxResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);

  const handleSend = async () => {
    if (!publicKey) return;

    setIsSending(true);
    setTxResult(null);

    try {
      const result = await sendXLMTransaction(publicKey, destination.trim(), amount, memo || undefined);
      setTxResult(result);

      if (result.success) {
        setDestination('');
        setAmount('');
        setMemo('');
        await refreshBalance();
        loadHistory();
      }
    } catch (error) {
      setTxResult({
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setIsSending(false);
    }
  };

  const loadHistory = async () => {
    if (!publicKey) return;
    setLoadingHistory(true);
    try {
      const txs = await getTransactionHistory(publicKey);
      setHistory(txs as TxRecord[]);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1>Send XLM</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Execute fast, low-cost token transfers on the Stellar Testnet.
          </p>
        </div>
      </div>

      {/* Wallet alert */}
      {!isConnected && (
        <div className="alert-banner alert-warning flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Connect your Freighter wallet to send transactions.</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center gap-2">
            <Wallet size={16} /> Connect
          </button>
        </div>
      )}

      {/* Transaction Result */}
      {txResult && (
        <div
          className="p-5 rounded-2xl animate-fade-in-up flex items-start gap-4"
          style={{
            background: txResult.success ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255, 68, 68, 0.05)',
            border: `1px solid ${txResult.success ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 68, 68, 0.2)'}`,
          }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: txResult.success ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 68, 68, 0.1)', color: txResult.success ? 'var(--neon-green)' : 'var(--danger)' }}>
            {txResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold mb-1" style={{ color: txResult.success ? 'var(--neon-green)' : 'var(--danger)' }}>
              {txResult.success ? 'Transaction Successful!' : 'Transaction Failed'}
            </h3>
            
            {txResult.hash && (
              <div className="mt-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Transaction Hash</div>
                <div className="flex items-center justify-between gap-4">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm no-underline truncate flex-1"
                    style={{ color: 'var(--neon-cyan)' }}
                  >
                    {txResult.hash}
                  </a>
                  <button
                    onClick={() => copyHash(txResult.hash!)}
                    className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    title="Copy Hash"
                  >
                    {copied === txResult.hash ? <CheckCircle size={16} style={{ color: 'var(--neon-green)' }} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
            
            {txResult.error && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {txResult.error}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 stagger-children">
        {/* Send Form */}
        <div className="card p-8 card-glow relative overflow-hidden h-full">
          {/* Gradient accent top */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--neon-green), transparent)' }} />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.15)] shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              <Send size={22} style={{ color: 'var(--neon-green)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Transfer Details</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fill in the destination and amount</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className={`transition-all duration-300 ${activeField === 'dest' ? 'scale-[1.01]' : 'scale-100'}`}>
              <label className="form-label flex items-center justify-between">
                Destination Address
                {destination.length >= 10 && <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'dest' ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-neon pl-12 h-14 font-mono text-sm"
                  placeholder="G..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setActiveField('dest')}
                  onBlur={() => setActiveField(null)}
                />
              </div>
            </div>

            <div className={`transition-all duration-300 ${activeField === 'amount' ? 'scale-[1.01]' : 'scale-100'}`}>
              <label className="form-label flex items-center justify-between">
                Amount (XLM)
                {amount && parseFloat(amount) > 0 && <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />}
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'amount' ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                <input
                  type="number"
                  className="input-neon pl-12 h-14 text-lg font-bold font-mono"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => setActiveField('amount')}
                  onBlur={() => setActiveField(null)}
                  min="0"
                  step="0.0000001"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-50 select-none">
                  XLM
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${activeField === 'memo' ? 'scale-[1.01]' : 'scale-100'}`}>
              <label className="form-label">
                Memo (Optional)
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'memo' ? 'var(--neon-cyan)' : 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-neon pl-12 h-14"
                  placeholder="Payment reference..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  onFocus={() => setActiveField('memo')}
                  onBlur={() => setActiveField(null)}
                  maxLength={28}
                />
              </div>
              <p className="text-[10px] text-right mt-1" style={{ color: 'var(--text-muted)' }}>{memo.length}/28 chars</p>
            </div>

            <div className="pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <button
                onClick={handleSend}
                disabled={isSending || !isConnected || !destination || !amount}
                className="btn-neon w-full flex items-center justify-center gap-2 py-4 text-base shadow-[0_0_20px_rgba(57,255,20,0.15)]"
              >
                {isSending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending on-chain...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card p-0 flex flex-col h-full" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between bg-[rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3">
              <Clock size={18} style={{ color: 'var(--neon-cyan)' }} />
              <h2 className="text-lg font-bold">Recent Transfers</h2>
            </div>
            <button
              onClick={loadHistory}
              disabled={loadingHistory || !isConnected}
              className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5"
            >
              {loadingHistory ? <Loader2 size={12} className="animate-spin" /> : 'Refresh'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="empty-state-icon mb-4">
                  <Clock size={28} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No History</div>
                <div className="text-xs max-w-[200px] mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {isConnected ? 'Click refresh to load your recent on-chain transactions.' : 'Connect your wallet to view transaction history.'}
                </div>
              </div>
            ) : (
              history.map((tx, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.05)]"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: tx.successful ? 'rgba(57,255,20,0.1)' : 'rgba(255,68,68,0.1)', color: tx.successful ? 'var(--neon-green)' : 'var(--danger)' }}>
                        {tx.successful ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: tx.successful ? 'var(--neon-green)' : 'var(--danger)' }}>
                        {tx.successful ? 'Success' : 'Failed'}
                      </div>
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono no-underline hover:underline truncate mr-4 flex items-center gap-1.5"
                      style={{ color: 'var(--neon-cyan)' }}
                    >
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      <ExternalLink size={10} className="shrink-0" />
                    </a>
                    
                    {tx.memo && (
                      <div className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] truncate max-w-[100px]" title={tx.memo} style={{ color: 'var(--text-secondary)' }}>
                        {tx.memo}
                      </div>
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
