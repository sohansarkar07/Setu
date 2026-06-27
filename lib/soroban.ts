import { Client as InvoiceClient, networks as invoiceNetworks } from 'invoice-client';
import { Client as TokenClient, networks as tokenNetworks } from 'token-client';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { rpc, xdr } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = invoiceNetworks.testnet.networkPassphrase;

export const invoiceClient = new InvoiceClient({
  ...invoiceNetworks.testnet,
  rpcUrl: RPC_URL,
});

export const tokenClient = new TokenClient({
  ...tokenNetworks.testnet,
  rpcUrl: RPC_URL,
});

export const server = new rpc.Server(RPC_URL);

/**
 * Connect to Freighter Wallet
 */
export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error('Freighter wallet is not installed or locked.');
  }
  
  const access = await requestAccess();
  if (access.error) {
    throw new Error(`Freighter Access Denied: ${access.error}`);
  }
  return access.address;
}

/**
 * Sign and submit XDR to Soroban
 */
export async function signAndSubmit(xdrString: string): Promise<string> {
  const activeWallet = typeof window !== 'undefined' ? localStorage.getItem('setu_wallet_connected') : 'freighter';
  let signedTx = '';

  if (activeWallet === 'albedo') {
    const albedo = (await import('@albedo-link/intent')).default;
    try {
      const res = await albedo.tx({ xdr: xdrString, network: 'testnet' });
      signedTx = res.signed_envelope_xdr;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Albedo Transaction Rejected: ${msg}`);
    }
  } else if (activeWallet === 'xbull') {
    const { xBullWalletConnect } = await import('@creit.tech/xbull-wallet-connect');
    const xbull = new xBullWalletConnect();
    try {
      signedTx = await xbull.sign({ xdr: xdrString, network: 'TESTNET' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`xBull Transaction Rejected: ${msg}`);
    }
  } else {
    // Default to Freighter
    const signedResponse = await signTransaction(xdrString, {
      network: 'TESTNET',
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    
    if (signedResponse.error) {
      throw new Error(`Transaction Rejected by User: ${signedResponse.error}`);
    }
    signedTx = signedResponse.signedTx;
  }

  // Submit to network
  const tx = xdr.TransactionEnvelope.fromXDR(signedTx, 'base64');
  const response = await server.sendTransaction(tx);
  
  if (response.status === 'ERROR') {
    throw new Error(`Network Error: Transaction failed to submit. ${response.errorResultXdr}`);
  }

  // Poll for completion
  let statusResponse = await server.getTransaction(response.hash);
  while (statusResponse.status === 'NOT_FOUND') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    statusResponse = await server.getTransaction(response.hash);
  }

  if (statusResponse.status === 'SUCCESS') {
    return response.hash;
  } else {
    throw new Error(`Contract Error: Transaction failed on-chain execution.`);
  }
}

// ----- Business Logic Helpers -----

export async function mintInvoiceOnChain(
  supplier: string, 
  buyer: string, 
  amount: bigint, 
  description: string, 
  due_date: bigint
) {
  const tx = await invoiceClient.mint_invoice({ supplier, buyer, amount, description, due_date });
  if (!tx.built) throw new Error("Failed to build transaction");
  
  const hash = await signAndSubmit(tx.built.toXDR());
  // Re-fetch to get the return value (invoice ID)
  // Since we don't strictly need it for the mock UI right now, we just return the hash
  return hash;
}

export async function verifyInvoiceOnChain(buyer: string, invoice_id: bigint) {
  const tx = await invoiceClient.verify_invoice({ buyer, invoice_id });
  if (!tx.built) throw new Error("Failed to build transaction");
  return await signAndSubmit(tx.built.toXDR());
}

export async function fundInvoiceOnChain(investor: string, invoice_id: bigint) {
  const tx = await invoiceClient.fund_invoice({ investor, invoice_id });
  if (!tx.built) throw new Error("Failed to build transaction");
  return await signAndSubmit(tx.built.toXDR());
}
