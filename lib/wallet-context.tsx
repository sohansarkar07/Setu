'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getAccountBalance, shortenAddress, NETWORK } from './stellar';

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  xlmBalance: number;
  tokens: { asset: string; balance: string }[];
  network: string;
  error: string | null;
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

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Check if we're in a browser
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection requires a browser environment.');
      }

      const freighterApi = await import('@stellar/freighter-api');
      
      // Check if Freighter extension is installed
      const connected = await freighterApi.isConnected();
      if (!connected.isConnected) {
        throw new Error(
          'Freighter wallet extension is not installed. Please install it from https://freighter.app and reload the page.'
        );
      }

      // Request access and get address in one step
      const accessResult = await freighterApi.requestAccess();
      
      if (accessResult.error) {
        throw new Error(accessResult.error.message || 'Could not connect to Freighter. Please make sure it is unlocked.');
      }
      
      if (!accessResult.address) {
        throw new Error('Could not get wallet address. Please make sure Freighter is unlocked and try again.');
      }

      const publicKey = accessResult.address;
      
      // Fetch balance
      let xlmBalance = 0;
      let tokens: { asset: string; balance: string }[] = [];
      try {
        const balances = await getAccountBalance(publicKey);
        xlmBalance = parseFloat(balances.xlm) || 0;
        tokens = balances.tokens;
      } catch {
        // Account may not be funded yet, that's OK
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
      });

      // Store in localStorage
      localStorage.setItem('setu_wallet_connected', 'true');
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

  const disconnect = useCallback(() => {
    setState({
      publicKey: null,
      isConnected: false,
      isConnecting: false,
      xlmBalance: 0,
      tokens: [],
      network: NETWORK,
      error: null,
    });
    localStorage.removeItem('setu_wallet_connected');
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    const wasConnected = localStorage.getItem('setu_wallet_connected');
    if (wasConnected === 'true') {
      setTimeout(() => connect(), 0);
    }
  }, [connect]);

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
