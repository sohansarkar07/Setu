// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getAccountBalance, shortenAddress, NETWORK } from './stellar';

interface AlbedoIntent {
  publicKey: (params: Record<string, unknown>) => Promise<{ pubkey: string }>;
  tx: (params: { xdr: string; network: string }) => Promise<{ signed_envelope_xdr: string }>;
}

let albedoInstance: AlbedoIntent | null = null;
if (typeof window !== 'undefined') {
  import('@albedo-link/intent').then(module => {
    albedoInstance = module.default as AlbedoIntent;
  }).catch(err => console.error('Failed to load albedo', err));
}

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  xlmBalance: number;
  tokens: { asset: string; balance: string }[];
  network: string;
  error: string | null;
  activeWallet: 'freighter' | 'albedo' | 'xbull' | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  shortenedAddress: string;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    isConnecting: false,
    xlmBalance: 0,
    tokens: [],
    network: NETWORK,
    error: null,
    activeWallet: null,
  });

  const refreshBalance = useCallback(async () => {
    if (!state.publicKey) return;
    try {
      const balances = await getAccountBalance(state.publicKey);
      setState(prev => ({
        ...prev,
        xlmBalance: parseFloat(balances.xlm) || 0,
        tokens: balances.tokens,
      }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [state.publicKey]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const connect = useCallback(async () => {
    setIsModalOpen(true);
  }, []);

  const connectFreighter = useCallback(async () => {
    setIsModalOpen(false);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection requires a browser environment.');
      }

      const freighterApi = await import('@stellar/freighter-api');
      
      const connected = await freighterApi.isConnected();
      let isWalletConnected = false;
      if (typeof connected === 'boolean') {
        isWalletConnected = connected;
      } else if (typeof connected === 'object' && connected !== null) {
        isWalletConnected = Boolean((connected as Record<string, unknown>).isConnected);
      }
      
      if (!isWalletConnected) {
        throw new Error('Freighter wallet extension is not installed. Please install it from https://freighter.app and reload the page.');
      }

      const accessResult = await freighterApi.requestAccess();
      let publicKey = '';
      
      if (typeof accessResult === 'string') {
        publicKey = accessResult;
      } else if (typeof accessResult === 'object' && accessResult !== null) {
        const res = accessResult as Record<string, unknown>;
        if (res.error) {
          const errMsg = typeof res.error === 'string' ? res.error : (res.error as Error).message || 'Could not connect to Freighter.';
          throw new Error(errMsg);
        }
        publicKey = (typeof res.address === 'string' ? res.address : '') || (typeof res.publicKey === 'string' ? res.publicKey : '');
      }

      if (!publicKey) {
        throw new Error('Could not get wallet address. Please make sure Freighter is unlocked and try again.');
      }
      let xlmBalance = 0;
      let tokens: { asset: string; balance: string }[] = [];
      try {
        const balances = await getAccountBalance(publicKey);
        xlmBalance = parseFloat(balances.xlm) || 0;
        tokens = balances.tokens;
      } catch {
        console.warn('Account not funded on testnet yet');
      }
      
      setState({
        publicKey,
        isConnected: true,
        isConnecting: false,
        xlmBalance,
        tokens,
        network: NETWORK,
        error: null,
        activeWallet: 'freighter',
      });

      localStorage.setItem('setu_wallet_connected', 'freighter');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      console.error('Wallet connection error:', error);
    }
  }, []);

  const connectAlbedo = useCallback(async () => {
    setIsModalOpen(false);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection requires a browser environment.');
      }

      if (!albedoInstance) {
        throw new Error('Albedo SDK not loaded yet. Please try again.');
      }
      const res = await albedoInstance.publicKey({});
      const publicKey = res.pubkey;
      
      let xlmBalance = 0;
      let tokens: { asset: string; balance: string }[] = [];
      try {
        const balances = await getAccountBalance(publicKey);
        xlmBalance = parseFloat(balances.xlm) || 0;
        tokens = balances.tokens;
      } catch {
        console.warn('Account not funded on testnet yet');
      }
      
      setState({
        publicKey,
        isConnected: true,
        isConnecting: false,
        xlmBalance,
        tokens,
        network: NETWORK,
        error: null,
        activeWallet: 'albedo',
      });

      localStorage.setItem('setu_wallet_connected', 'albedo');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect Albedo';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      console.error('Albedo connection error:', error);
    }
  }, []);

  const connectXbull = useCallback(async () => {
    setIsModalOpen(false);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection requires a browser environment.');
      }

      const { xBullWalletConnect } = await import('@creit.tech/xbull-wallet-connect');
      const xbull = new xBullWalletConnect();
      
      const publicKey = await xbull.connect();
      
      let xlmBalance = 0;
      let tokens: { asset: string; balance: string }[] = [];
      try {
        const balances = await getAccountBalance(publicKey);
        xlmBalance = parseFloat(balances.xlm) || 0;
        tokens = balances.tokens;
      } catch {
        console.warn('Account not funded on testnet yet');
      }
      
      setState({
        publicKey,
        isConnected: true,
        isConnecting: false,
        xlmBalance,
        tokens,
        network: NETWORK,
        error: null,
        activeWallet: 'xbull',
      });

      localStorage.setItem('setu_wallet_connected', 'xbull');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect xBull';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      console.error('xBull connection error:', error);
    }
  }, []);

  const handleWalletSelect = (wallet: string) => {
    if (wallet === 'freighter') {
      connectFreighter();
    } else if (wallet === 'albedo') {
      connectAlbedo();
    } else if (wallet === 'xbull') {
      connectXbull();
    } else {
      setState(prev => ({ ...prev, error: `${wallet} integration coming soon!` }));
      setIsModalOpen(false);
    }
  };

  const disconnect = useCallback(() => {
    setState({
      publicKey: null,
      isConnected: false,
      isConnecting: false,
      xlmBalance: 0,
      tokens: [],
      network: NETWORK,
      error: null,
      activeWallet: null,
    });
    localStorage.removeItem('setu_wallet_connected');
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    const connectedWallet = localStorage.getItem('setu_wallet_connected');
    if (connectedWallet === 'freighter' || connectedWallet === 'true') {
      setTimeout(() => connectFreighter(), 0);
    } else if (connectedWallet === 'albedo') {
      setTimeout(() => connectAlbedo(), 0);
    } else if (connectedWallet === 'xbull') {
      setTimeout(() => connectXbull(), 0);
    }
  }, [connectFreighter, connectAlbedo, connectXbull]);

  // Periodic balance refresh
  useEffect(() => {
    if (!state.isConnected) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    shortenedAddress: state.publicKey ? shortenAddress(state.publicKey) : '',
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      
      {/* Wallet Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div 
            className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
            style={{ border: '1px solid var(--border-primary)', background: 'linear-gradient(180deg, var(--bg-secondary), rgba(10, 10, 10, 0.95))' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Connect Wallet</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-[var(--text-secondary)] text-sm mb-6">Select a Stellar wallet to connect to Setu.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleWalletSelect('freighter')}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(57,255,20,0.05)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(57,255,20,0.3)] group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center p-2 border border-[rgba(255,255,255,0.1)] group-hover:border-[var(--neon-green)] transition-colors">
                    {/* Freighter Logo SVG / Placeholder */}
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[var(--text-primary)] group-hover:text-[var(--neon-green)] transition-colors"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--neon-green)] transition-colors">Freighter</div>
                    <div className="text-xs text-[var(--text-secondary)]">Fully integrated</div>
                  </div>
                </div>
                <div className="text-[var(--neon-green)] text-xs font-semibold px-2 py-1 rounded bg-[rgba(57,255,20,0.1)] opacity-0 group-hover:opacity-100 transition-opacity">Popular</div>
              </button>
              
              <button 
                onClick={() => handleWalletSelect('xbull')}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.3)] group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
                    <span className="font-bold text-[var(--text-primary)]">xB</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-primary)]">xBull Wallet</div>
                    <div className="text-xs text-[var(--text-secondary)]">Stellar ecosystem wallet</div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handleWalletSelect('Albedo')}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] opacity-70 hover:opacity-100 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
                    <span className="font-bold text-[var(--text-primary)]">A</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-primary)]">Albedo</div>
                    <div className="text-xs text-[var(--text-secondary)]">Browser-based wallet</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
              By connecting a wallet, you agree to Setu&apos;s Terms of Service.
            </div>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
