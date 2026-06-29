// @ts-nocheck
import { Client as InvoiceClient, networks as invoiceNetworks } from 'invoice-client';
import { Client as TokenClient, networks as tokenNetworks } from 'token-client';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { rpc, xdr } from '@stellar/stellar-sdk';

interface AlbedoIntent {
  tx: (params: { xdr: string; network: string }) => Promise<{ signed_envelope_xdr: string }>;
}

let albedoInstance: AlbedoIntent | null = null;
if (typeof window !== 'undefined') {
  import('@albedo-link/intent').then(module => {
    albedoInstance = module.default as AlbedoIntent;
  }).catch(err => console.error('Failed to load albedo', err));
}

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = invoiceNetworks.testnet.networkPassphrase;

export function getInvoiceClient(publicKey?: string) {
  return new InvoiceClient({
    ...invoiceNetworks.testnet,
    rpcUrl: RPC_URL,
    ...(publicKey ? { publicKey } : {}),
  });
}


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
    try {
      if (!albedoInstance) {
        throw new Error('Albedo SDK not loaded yet. Please try again.');
      }
      const res = await albedoInstance.tx({ xdr: xdrString, network: 'testnet' });
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
    // Extract public key to pass as accountToSign if we can parse it from the transaction
    try {
      const tx = xdr.TransactionEnvelope.fromXDR(xdrString, 'base64');
      const source = tx.v1()?.tx().sourceAccount().ed25519();
      if (source) {
        // Just acknowledging the source account logic is present
      }
    } catch (e) {
      // ignore
    }
    
    // Default to Freighter
    const signedResponse = await signTransaction(xdrString, {
      network: 'TESTNET',
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    
    if (typeof signedResponse === 'object' && signedResponse !== null) {
      const responseObj = signedResponse as Record<string, unknown>;
      
      if ('error' in responseObj && responseObj.error) {
        const errMsg = typeof responseObj.error === 'string' 
          ? responseObj.error 
          : JSON.stringify(responseObj.error);
        throw new Error(`Freighter Error: ${errMsg}`);
      }
    }
    
    let signedTx = '';
    
    if (typeof signedResponse === 'string') {
      signedTx = signedResponse;
    } else if (typeof signedResponse === 'object' && signedResponse !== null) {
      const responseObj = signedResponse as Record<string, unknown>;
      if (typeof responseObj.signedTx === 'string') signedTx = responseObj.signedTx;
      else if (typeof responseObj.transactionXdr === 'string') signedTx = responseObj.transactionXdr;
      else if (typeof responseObj.signedTransaction === 'string') signedTx = responseObj.signedTransaction;
      else if (typeof responseObj.tx === 'string') signedTx = responseObj.tx;
      else if (typeof responseObj.xdr === 'string') signedTx = responseObj.xdr;
    }
    
    if (!signedTx) {
      throw new Error(`Freighter success response format unknown: ${JSON.stringify(signedResponse)}`);
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
  const client = getInvoiceClient(supplier);
  const tx = await client.mint_invoice({ supplier, buyer, amount, description, due_date });
  if (!tx.built) throw new Error("Failed to build transaction");
  
  const hash = await signAndSubmit(tx.built.toXDR());
  // Re-fetch to get the return value (invoice ID)
  // Since we don't strictly need it for the mock UI right now, we just return the hash
  return hash;
}

export async function verifyInvoiceOnChain(buyer: string, invoice_id: bigint) {
  const client = getInvoiceClient(buyer);
  const tx = await client.verify_invoice({ buyer, invoice_id });
  if (!tx.built) throw new Error("Failed to build transaction");
  return await signAndSubmit(tx.built.toXDR());
}

export async function fundInvoiceOnChain(investor: string, invoice_id: bigint) {
  const client = getInvoiceClient(investor);
  const tx = await client.fund_invoice({ investor, invoice_id });
  if (!tx.built) throw new Error("Failed to build transaction");
  return await signAndSubmit(tx.built.toXDR());
}

export async function approveKYCOnChain(admin: string, investor: string) {
  const client = getInvoiceClient(admin);
  const tx = await client.approve_kyc({ admin, investor });
  if (!tx.built) throw new Error("Failed to build approve_kyc transaction");
  return await signAndSubmit(tx.built.toXDR());
}

export async function revokeKYCOnChain(admin: string, investor: string) {
  const client = getInvoiceClient(admin);
  const tx = await client.revoke_kyc({ admin, investor });
  if (!tx.built) throw new Error("Failed to build revoke_kyc transaction");
  return await signAndSubmit(tx.built.toXDR());
}

export async function checkKYCOnChain(investor: string): Promise<boolean> {
  const client = getInvoiceClient();
  const tx = await client.is_kyc_approved({ investor });
  if (!tx.result) return false;
  return tx.result;
}
