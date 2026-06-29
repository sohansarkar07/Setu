'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useInvoiceStore } from '@/lib/invoice-store';
import { mintInvoiceOnChain } from '@/lib/soroban';
import {
  FileText, Wallet, AlertCircle, CheckCircle, Loader2,
  Calendar, DollarSign, User, FileCheck, ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function MintInvoicePage() {
  const { isConnected, publicKey, connect, isConnecting } = useWallet();
  const { mintInvoice, addNotification } = useInvoiceStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ success: boolean; invoiceId?: string; txHash?: string; error?: string } | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);

  const handleMint = async () => {
    if (!publicKey) {
      addNotification('error', 'Wallet Required', 'Please connect your Freighter wallet first');
      return;
    }

    if (!description.trim()) {
      addNotification('error', 'Validation Error', 'Please enter a description');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addNotification('error', 'Validation Error', 'Please enter a valid positive amount');
      return;
    }

    if (!dueDate) {
      addNotification('error', 'Validation Error', 'Please select a due date');
      return;
    }

    if (!buyerAddress.trim() || buyerAddress.length < 10) {
      addNotification('error', 'Validation Error', 'Please enter a valid buyer Stellar address');
      return;
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      // Real on-chain Soroban transaction
      const txHash = await mintInvoiceOnChain(
        publicKey,
        buyerAddress.trim(),
        BigInt(Math.floor(parsedAmount * 10_000_000)), // Convert to decimals (7)
        description.trim(),
        BigInt(new Date(dueDate).getTime() / 1000) // Unix timestamp
      );

      const invoice = mintInvoice({
        description: description.trim(),
        amount: parsedAmount,
        dueDate,
        supplier: publicKey,
        buyer: buyerAddress.trim(),
        txHash: txHash,
      });

      setMintResult({
        success: true,
        invoiceId: invoice.id,
        txHash: txHash,
      });

      // Reset form
      setDescription('');
      setAmount('');
      setDueDate('');
      setBuyerAddress('');
    } catch (error) {
      console.error("Minting failed:", error);
      let errMsg = 'An unknown error occurred';
      if (error instanceof Error) {
        errMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errMsg = JSON.stringify(error);
      } else {
        errMsg = String(error);
      }
      addNotification('error', 'Minting Failed', errMsg);
      setMintResult({ success: false, error: errMsg });
    } finally {
      setIsMinting(false);
    }
  };

  const getFormProgress = () => {
    let completed = 0;
    if (description.trim()) completed++;
    if (amount && parseFloat(amount) > 0) completed++;
    if (dueDate) completed++;
    if (buyerAddress.trim() && buyerAddress.length >= 10) completed++;
    return (completed / 4) * 100;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <h1>Mint New Invoice</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tokenize your accounts receivable on the Stellar blockchain.
        </p>
      </div>

      {/* Wallet connection alert */}
      {!isConnected && (
        <div className="alert-banner alert-warning flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,170,0,0.1)] border border-[rgba(255,170,0,0.2)] text-[var(--warning)] shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--warning)' }}>Wallet Required</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Connect your Freighter wallet to mint invoices on-chain.</div>
            </div>
          </div>
          <button onClick={connect} disabled={isConnecting} className="btn-neon text-sm flex items-center justify-center gap-2 px-6 w-full sm:w-auto shrink-0">
            <Wallet size={16} /> Connect
          </button>
        </div>
      )}

      {/* Mint result */}
      {mintResult && (
        <div
          className="p-6 rounded-2xl animate-fade-in-up"
          style={{
            background: mintResult.success ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255, 68, 68, 0.05)',
            border: `1px solid ${mintResult.success ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 68, 68, 0.2)'}`,
            boxShadow: `0 0 30px ${mintResult.success ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255, 68, 68, 0.05)'}`,
          }}
        >
          <div className="flex items-center gap-3 mb-4 border-b pb-4" style={{ borderColor: mintResult.success ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 68, 68, 0.1)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: mintResult.success ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 68, 68, 0.1)', color: mintResult.success ? 'var(--neon-green)' : 'var(--danger)' }}>
              {mintResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <span className="text-lg font-bold" style={{ color: mintResult.success ? 'var(--neon-green)' : 'var(--danger)' }}>
              {mintResult.success ? 'Invoice Minted Successfully!' : 'Minting Failed'}
            </span>
          </div>
          
          <div className="space-y-3 pl-13">
            {mintResult.invoiceId && (
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Invoice ID</div>
                <div className="font-mono text-sm px-3 py-2 rounded-lg inline-block" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                  {mintResult.invoiceId}
                </div>
              </div>
            )}
            {mintResult.txHash && (
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold mb-1 mt-2" style={{ color: 'var(--text-muted)' }}>Transaction</div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${mintResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm no-underline inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)]"
                  style={{ color: 'var(--neon-cyan)', background: 'rgba(0,240,255,0.05)' }}
                >
                  {mintResult.txHash.slice(0, 16)}...{mintResult.txHash.slice(-8)}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
            {mintResult.error && (
              <div className="text-xs mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,68,68,0.2)' }}>
                <strong>Note:</strong> {mintResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice form */}
      <div className="card p-8 card-glow neon-border-animated overflow-hidden">
        {/* Form progress header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.2)] shadow-[0_0_15px_rgba(57,255,20,0.15)] relative">
              <FileCheck size={24} style={{ color: 'var(--neon-green)' }} />
              {getFormProgress() === 100 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--neon-green)] flex items-center justify-center border-2 border-[var(--bg-card)]">
                  <CheckCircle size={10} color="#000" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">Invoice Details</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Fill in the details to tokenize your asset</p>
            </div>
          </div>
          
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Progress</div>
            <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
              <div 
                className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)] transition-all duration-500 ease-out" 
                style={{ width: `${getFormProgress()}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Description */}
          <div className={`transition-all duration-300 ${activeField === 'desc' ? 'scale-[1.01]' : 'scale-100'}`}>
            <label className="form-label flex items-center justify-between">
              Description
              {description && <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />}
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'desc' ? 'var(--neon-green)' : 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-neon pl-12 h-14"
                placeholder="e.g. Q3 Web Development Services"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setActiveField('desc')}
                onBlur={() => setActiveField(null)}
              />
            </div>
          </div>

          {/* Amount + Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`transition-all duration-300 ${activeField === 'amount' ? 'scale-[1.02]' : 'scale-100'}`}>
              <label className="form-label flex items-center justify-between">
                Amount (XLM)
                {amount && parseFloat(amount) > 0 && <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />}
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'amount' ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                <input
                  type="number"
                  className="input-neon pl-12 h-14 text-lg font-bold font-mono"
                  placeholder="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => setActiveField('amount')}
                  onBlur={() => setActiveField(null)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${activeField === 'date' ? 'scale-[1.02]' : 'scale-100'}`}>
              <label className="form-label flex items-center justify-between">
                Due Date
                {dueDate && <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />}
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'date' ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="input-neon pl-12 h-14"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onFocus={() => setActiveField('date')}
                  onBlur={() => setActiveField(null)}
                />
              </div>
            </div>
          </div>

          {/* Buyer Address */}
          <div className={`transition-all duration-300 ${activeField === 'buyer' ? 'scale-[1.01]' : 'scale-100'}`}>
            <label className="form-label flex items-center justify-between">
              Buyer Address (Stellar Public Key)
              {buyerAddress.length >= 10 && <CheckCircle size={14} style={{ color: 'var(--neon-green)' }} />}
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: activeField === 'buyer' ? 'var(--neon-cyan)' : 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-neon pl-12 h-14 font-mono text-sm"
                placeholder="G..."
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                onFocus={() => setActiveField('buyer')}
                onBlur={() => setActiveField(null)}
              />
            </div>
            <p className="form-hint">
              Enter the public key of the buyer responsible for paying this invoice.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 mt-8 border-t border-[rgba(255,255,255,0.05)]">
            <button
              onClick={handleMint}
              disabled={isMinting || !isConnected}
              className="btn-neon w-full flex items-center justify-center gap-3 py-4 text-base shadow-[0_0_30px_rgba(57,255,20,0.2)] hover:shadow-[0_0_40px_rgba(57,255,20,0.3)]"
            >
              {isMinting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Minting On-Chain...
                </>
              ) : (
                <>
                  <FileCheck size={20} />
                  Mint Draft Invoice (On-Chain)
                </>
              )}
            </button>

            {!isConnected && (
              <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                You must connect your wallet before minting.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
