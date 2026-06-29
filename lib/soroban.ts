import { Client as InvoiceClient, networks as invoiceNetworks } from 'invoice-client';
import { Client as TokenClient, networks as tokenNetworks } from 'token-client';
import { signTransaction } from '@stellar/freighter-api';
import { rpc, TransactionBuilder } from '@stellar/stellar-sdk';

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

/**
 * Sign and submit XDR to Soroban
 */
export async function signAndSubmit(xdrString: string): Promise<string> {
  const activeWallet =
    typeof window !== 'undefined'
      ? localStorage.getItem('setu_wallet_connected')
      : 'freighter';

  // ── 1. Get the signed XDR ──────────────────────────────────────────────────
  let signedTx = '';

  if (activeWallet === 'albedo') {
    if (!albedoInstance) {
      throw new Error('Albedo SDK not loaded yet. Please try again.');
    }
    const res = await albedoInstance.tx({ xdr: xdrString, network: 'testnet' });
    signedTx = res.signed_envelope_xdr;

  } else if (activeWallet === 'xbull') {
    const { xBullWalletConnect } = await import('@creit.tech/xbull-wallet-connect');
    const xbull = new xBullWalletConnect();
    signedTx = await xbull.sign({ xdr: xdrString, network: 'TESTNET' });

  } else {
    // Freighter
    let signedResponse: unknown;
    try {
      signedResponse = await signTransaction(xdrString, {
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
    // Earlier versions return a plain string
    if (typeof signedResponse === 'string') {
      signedTx = signedResponse;
    } else if (typeof signedResponse === 'object' && signedResponse !== null) {
      const r = signedResponse as Record<string, unknown>;

      // Check for an error field first
      if (r.error) {
        const errMsg =
          typeof r.error === 'string' ? r.error : JSON.stringify(r.error);
        throw new Error(`Freighter signing rejected: ${errMsg}`);
      }

      // Try every known field name for the signed XDR
      const candidate =
        r.signedTxXdr ??
        r.signedTx ??
        r.transactionXdr ??
        r.signedTransaction ??
        r.tx ??
        r.xdr;

      if (typeof candidate === 'string') {
        signedTx = candidate;
      } else {
        throw new Error(
          `Unknown Freighter response format: ${JSON.stringify(signedResponse)}`
        );
      }
    } else {
      throw new Error(`Freighter returned unexpected value: ${String(signedResponse)}`);
    }
  }

  // ── 2. Submit to network ───────────────────────────────────────────────────
  const txObject = TransactionBuilder.fromXDR(signedTx, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(txObject);

  if (response.status === 'ERROR') {
    throw new Error(
      `Network Error: Transaction failed to submit. ${response.errorResultXdr}`
    );
  }

  // ── 3. Poll for confirmation ───────────────────────────────────────────────
  let statusResponse = await server.getTransaction(response.hash);
  while (statusResponse.status === 'NOT_FOUND') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    statusResponse = await server.getTransaction(response.hash);
  }

  if (statusResponse.status === 'SUCCESS') {
    return response.hash;
  }

  throw new Error('Contract Error: Transaction failed on-chain execution.');
}

// ── Business Logic Helpers ─────────────────────────────────────────────────

export async function mintInvoiceOnChain(
  supplier: string,
  buyer: string,
  amount: bigint,
  description: string,
  due_date: bigint
) {
  const client = getInvoiceClient(supplier);
  const tx = await client.mint_invoice({ supplier, buyer, amount, description, due_date });
  if (!tx.built) throw new Error('Failed to build transaction');
  return await signAndSubmit(tx.built.toXDR());
}

export async function verifyInvoiceOnChain(buyer: string, invoice_id: bigint) {
  const client = getInvoiceClient(buyer);
  const tx = await client.verify_invoice({ buyer, invoice_id });
  if (!tx.built) throw new Error('Failed to build transaction');
  return await signAndSubmit(tx.built.toXDR());
}

export async function fundInvoiceOnChain(investor: string, invoice_id: bigint) {
  const client = getInvoiceClient(investor);
  const tx = await client.fund_invoice({ investor, invoice_id });
  if (!tx.built) throw new Error('Failed to build transaction');
  return await signAndSubmit(tx.built.toXDR());
}

export async function approveKYCOnChain(admin: string, investor: string) {
  const client = getInvoiceClient(admin);
  const tx = await client.approve_kyc({ admin, investor });
  if (!tx.built) throw new Error('Failed to build approve_kyc transaction');
  return await signAndSubmit(tx.built.toXDR());
}

export async function revokeKYCOnChain(admin: string, investor: string) {
  const client = getInvoiceClient(admin);
  const tx = await client.revoke_kyc({ admin, investor });
  if (!tx.built) throw new Error('Failed to build revoke_kyc transaction');
  return await signAndSubmit(tx.built.toXDR());
}

export async function checkKYCOnChain(investor: string): Promise<boolean> {
  const client = getInvoiceClient();
  const tx = await client.is_kyc_approved({ investor });
  if (!tx.result) return false;
  return tx.result;
}
