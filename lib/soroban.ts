import { Client as InvoiceClient, networks as invoiceNetworks } from 'invoice-client';
import { Client as TokenClient, networks as tokenNetworks } from 'token-client';
import { signTransaction } from '@stellar/freighter-api';
import { rpc } from '@stellar/stellar-sdk';

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
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// ── Wallet-aware signer function ───────────────────────────────────────────
async function getSigner(): Promise<(xdr: string) => Promise<{ signedTxXdr: string }>> {
  const activeWallet =
    typeof window !== 'undefined'
      ? localStorage.getItem('setu_wallet_connected') ?? 'freighter'
      : 'freighter';

  if (activeWallet === 'albedo') {
    return async (xdr: string) => {
      if (!albedoInstance) throw new Error('Albedo SDK not loaded yet. Please try again.');
      const res = await albedoInstance.tx({ xdr, network: 'testnet' });
      return { signedTxXdr: res.signed_envelope_xdr };
    };
  }

  if (activeWallet === 'xbull') {
    return async (xdr: string) => {
      const { xBullWalletConnect } = await import('@creit.tech/xbull-wallet-connect');
      const xbull = new xBullWalletConnect();
      const signedTx = await xbull.sign({ xdr, network: 'TESTNET' });
      return { signedTxXdr: signedTx };
    };
  }

  // Default: Freighter
  return async (xdr: string) => {
    let result: unknown;
    try {
      result = await signTransaction(xdr, {
        network: 'TESTNET',
        networkPassphrase: NETWORK_PASSPHRASE,
      });
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null
          ? JSON.stringify(e)
          : String(e);
      throw new Error(`Freighter signing failed: ${msg}`);
    }

    // Freighter v6 returns { signedTxXdr: '...' }
    if (typeof result === 'string') {
      return { signedTxXdr: result };
    }
    if (typeof result === 'object' && result !== null) {
      const r = result as Record<string, unknown>;
      if (r.error) {
        const errMsg = typeof r.error === 'string' ? r.error : JSON.stringify(r.error);
        throw new Error(`Freighter signing rejected: ${errMsg}`);
      }
      const xdrValue =
        r.signedTxXdr ?? r.signedTx ?? r.transactionXdr ?? r.signedTransaction ?? r.tx ?? r.xdr;
      if (typeof xdrValue === 'string') {
        return { signedTxXdr: xdrValue };
      }
    }
    throw new Error(`Unknown Freighter response: ${JSON.stringify(result)}`);
  };
}

export function getInvoiceClient(publicKey?: string) {
  return new InvoiceClient({
    ...invoiceNetworks.testnet,
    rpcUrl: RPC_URL,
    ...(publicKey ? { publicKey } : {}),
  });
}

export function getTokenClient(publicKey?: string) {
  return new TokenClient({
    ...tokenNetworks.testnet,
    rpcUrl: RPC_URL,
    ...(publicKey ? { publicKey } : {}),
  });
}

export const server = new rpc.Server(RPC_URL);

// ── Business Logic Helpers ─────────────────────────────────────────────────

export async function mintInvoiceOnChain(
  supplier: string,
  buyer: string,
  amount: bigint,
  description: string,
  due_date: bigint
): Promise<string> {
  const signer = await getSigner();
  const client = getInvoiceClient(supplier);
  const assembled = await client.mint_invoice({ supplier, buyer, amount, description, due_date });

  await assembled.signAndSend({
    signTransaction: signer,
  });

  return assembled.sendTransactionResponse?.hash ?? assembled.sendTransactionResponse?.hash ?? 'success';
}

export async function verifyInvoiceOnChain(buyer: string, invoice_id: bigint): Promise<string> {
  const signer = await getSigner();
  const client = getInvoiceClient(buyer);
  
  // Simulate first to catch contract errors early
  const assembled = await client.verify_invoice({ buyer, invoice_id });
  
  if (!assembled.built) {
    throw new Error('Failed to build verify_invoice transaction. Check that the invoice exists and is in Draft status.');
  }
  
  await assembled.signAndSend({ signTransaction: signer });
  
  const hash = assembled.sendTransactionResponse?.hash;
  if (!hash) {
    throw new Error('Transaction was submitted but no hash was returned. Check Stellar explorer.');
  }
  return hash;
}

export async function fundInvoiceOnChain(investor: string, invoice_id: bigint): Promise<string> {
  const signer = await getSigner();
  const client = getInvoiceClient(investor);
  const assembled = await client.fund_invoice({ investor, invoice_id });
  await assembled.signAndSend({ signTransaction: signer });
  return assembled.sendTransactionResponse?.hash ?? 'success';
}

export async function approveKYCOnChain(admin: string, investor: string): Promise<string> {
  const signer = await getSigner();
  const client = getInvoiceClient(admin);
  const assembled = await client.approve_kyc({ admin, investor });
  await assembled.signAndSend({ signTransaction: signer });
  return assembled.sendTransactionResponse?.hash ?? 'success';
}

export async function revokeKYCOnChain(admin: string, investor: string): Promise<string> {
  const signer = await getSigner();
  const client = getInvoiceClient(admin);
  const assembled = await client.revoke_kyc({ admin, investor });
  await assembled.signAndSend({ signTransaction: signer });
  return assembled.sendTransactionResponse?.hash ?? 'success';
}

export async function checkKYCOnChain(investor: string): Promise<boolean> {
  const client = getInvoiceClient();
  const assembled = await client.is_kyc_approved({ investor });
  if (!assembled.result) return false;
  return assembled.result;
}
