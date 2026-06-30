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

// ── Wallet-aware signer function ──────────────────────────────────────────────
// The Stellar SDK calls our signer as: signer(xdr, { networkPassphrase, address? })
// We must forward these opts to Freighter v6 which reads networkPassphrase from them.
type SignerOpts = {
  networkPassphrase?: string;
  address?: string;
};

async function getSigner(): Promise<(xdr: string, opts?: SignerOpts) => Promise<{ signedTxXdr: string }>> {
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

  // Default: Freighter v6
  // We use Freighter's signTransaction directly with the opts the SDK provides.
  return async (xdr: string, opts?: SignerOpts) => {
    let result: unknown;
    try {
      result = await signTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
        ...(opts?.address ? { address: opts.address } : {}),
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

    if (typeof result === 'string') {
      return { signedTxXdr: result };
    }
    if (typeof result === 'object' && result !== null) {
      const r = result as Record<string, unknown>;
      if (r.error) {
        const errMsg = typeof r.error === 'string' ? r.error : JSON.stringify(r.error);
        // Empty error string means user cancelled
        if (!errMsg || errMsg === 'null') {
          throw new Error('Transaction was cancelled. Please approve in Freighter and try again.');
        }
        throw new Error(`Freighter signing rejected: ${errMsg}`);
      }
      const xdrValue =
        r.signedTxXdr ?? r.signedTx ?? r.transactionXdr ?? r.signedTransaction ?? r.tx ?? r.xdr;
      if (typeof xdrValue === 'string' && xdrValue) {
        return { signedTxXdr: xdrValue };
      }
    }
    throw new Error('Transaction was cancelled or Freighter returned an empty response.');
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

function extractTxHash(sendResult: unknown): string | undefined {
  if (!sendResult || typeof sendResult !== 'object') return undefined;
  
  // Use a type assertion that avoids explicit any
  const result = sendResult as Record<string, unknown>;
  
  if (typeof result.hash === 'string' && /^[0-9a-fA-F]{64}$/.test(result.hash)) {
    return result.hash;
  }
  
  if (typeof result.id === 'string' && /^[0-9a-fA-F]{64}$/.test(result.id)) {
    return result.id;
  }
  
  if (result.sendTransactionResponse && typeof result.sendTransactionResponse === 'object') {
    const nested = result.sendTransactionResponse as Record<string, unknown>;
    if (typeof nested.hash === 'string' && /^[0-9a-fA-F]{64}$/.test(nested.hash)) {
      return nested.hash;
    }
  }
  
  return undefined;
}

export async function mintInvoiceOnChain(
  supplier: string,
  buyer: string,
  amount: bigint,
  description: string,
  due_date: bigint
): Promise<{ txHash: string; chainId: number }> {
  const signer = await getSigner();
  const client = getInvoiceClient(supplier);
  const assembled = await client.mint_invoice({ supplier, buyer, amount, description, due_date });

  const sendResult = await assembled.signAndSend({
    signTransaction: signer,
  });

  const txHash = extractTxHash(sendResult) || extractTxHash(assembled) || 'success';
  // The result of mint_invoice is the new invoice's on-chain u64 ID
  const chainId = typeof assembled.result === 'bigint'
    ? Number(assembled.result)
    : 0;

  return { txHash, chainId };
}

// ΓöÇΓöÇ Read invoice count from chain ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export async function getInvoiceCountOnChain(): Promise<number> {
  const client = getInvoiceClient();
  const assembled = await client.get_invoice_count();
  if (typeof assembled.result === 'bigint') return Number(assembled.result);
  return 0;
}

// ΓöÇΓöÇ Read a specific invoice from chain (to validate it exists) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export async function getInvoiceFromChain(invoice_id: bigint) {
  const client = getInvoiceClient();
  const assembled = await client.get_invoice({ invoice_id });
  return assembled.result;
}

export async function verifyInvoiceOnChain(buyer: string, invoice_id: bigint): Promise<string> {
  // Pre-flight: verify the invoice actually exists on-chain before signing
  let onChainInvoice;
  try {
    onChainInvoice = await getInvoiceFromChain(invoice_id);
  } catch {
    // Try ID - 1 in case the contract uses 0-based indexing  
    if (invoice_id > BigInt(0)) {
      try {
        onChainInvoice = await getInvoiceFromChain(invoice_id - BigInt(1));
        invoice_id = invoice_id - BigInt(1); // Use the working ID
      } catch {
        throw new Error(
          `Invoice not found on-chain. The invoice may not have been minted yet. Please mint a new invoice and try again.`
        );
      }
    } else {
      throw new Error(
        `Invoice not found on-chain. The invoice may not have been minted yet. Please mint a new invoice and try again.`
      );
    }
  }

  if (!onChainInvoice) {
    throw new Error('Invoice not found on-chain. Please mint a new invoice first.');
  }

  // Validate the on-chain invoice details match the expectation
  if (onChainInvoice.buyer !== buyer) {
    throw new Error(`Invoice buyer mismatch. Expected ${buyer}, but on-chain invoice is for ${onChainInvoice.buyer}`);
  }

  // Check the status (status is usually an enum or number, assuming 0 or 'Draft' is the initial status)
  // We'll stringify it to check safely
  const statusStr = JSON.stringify(onChainInvoice.status);
  
  if (statusStr.toLowerCase().includes('verified') || statusStr === '1') {
    // Already verified on chain, just return success so local state can catch up
    return 'already_verified';
  }
  
  if (!statusStr.toLowerCase().includes('draft') && statusStr !== '0') {
    throw new Error(`Invoice is not in Draft status. Current status: ${statusStr}`);
  }

  const signer = await getSigner();
  const client = getInvoiceClient(buyer);
  
  const assembled = await client.verify_invoice({ buyer, invoice_id });
  
  if (!assembled.built) {
    throw new Error('Failed to build verify_invoice transaction.');
  }
  
  const sendResult = await assembled.signAndSend({ signTransaction: signer });
  
  const hash = extractTxHash(sendResult) || extractTxHash(assembled);
  return hash || 'success';
}


export async function fundInvoiceOnChain(investor: string, invoice_id: bigint): Promise<string> {
  // Pre-flight: verify the invoice actually exists on-chain before signing
  let onChainInvoice;
  try {
    onChainInvoice = await getInvoiceFromChain(invoice_id);
  } catch {
    // Try ID - 1 in case the contract uses 0-based indexing  
    if (invoice_id > BigInt(0)) {
      try {
        onChainInvoice = await getInvoiceFromChain(invoice_id - BigInt(1));
        invoice_id = invoice_id - BigInt(1); // Use the working ID
      } catch {
        throw new Error(`Invoice not found on-chain.`);
      }
    } else {
      throw new Error(`Invoice not found on-chain.`);
    }
  }

  if (!onChainInvoice) {
    throw new Error('Invoice not found on-chain.');
  }

  const statusStr = JSON.stringify(onChainInvoice.status);
  
  if (statusStr.toLowerCase().includes('funded') || statusStr === '2') {
    return 'already_funded';
  }
  
  if (!statusStr.toLowerCase().includes('verified') && statusStr !== '1') {
    throw new Error(`Invoice is not in Verified status. Current status: ${statusStr}`);
  }

  // Pre-flight check KYC
  const isKyc = await checkKYCOnChain(investor);
  if (!isKyc) {
    throw new Error('Your KYC is not approved. You must be KYC approved to fund invoices.');
  }

  const signer = await getSigner();
  const client = getInvoiceClient(investor);
  const assembled = await client.fund_invoice({ investor, invoice_id });
  
  if (!assembled.built) {
    throw new Error('Failed to build fund_invoice transaction.');
  }
  
  const sendResult = await assembled.signAndSend({ signTransaction: signer });
  const hash = extractTxHash(sendResult) || extractTxHash(assembled);
  return hash || 'success';
}

export async function getAdminOnChain(): Promise<string> {
  const client = getInvoiceClient();
  const assembled = await client.get_admin();
  return assembled.result as string;
}

export async function approveKYCOnChain(admin: string, investor: string): Promise<string> {
  const onChainAdmin = await getAdminOnChain();
  if (onChainAdmin !== admin) {
    throw new Error(`You are not the contract admin. Admin is ${onChainAdmin.substring(0, 5)}...${onChainAdmin.slice(-4)}`);
  }

  const signer = await getSigner();
  const client = getInvoiceClient(admin);
  const assembled = await client.approve_kyc({ admin, investor });
  
  if (!assembled.built) {
    throw new Error('Failed to build approve_kyc transaction.');
  }
  
  const sendResult = await assembled.signAndSend({ signTransaction: signer });
  const hash = extractTxHash(sendResult) || extractTxHash(assembled);
  return hash || 'success';
}

export async function revokeKYCOnChain(admin: string, investor: string): Promise<string> {
  const onChainAdmin = await getAdminOnChain();
  if (onChainAdmin !== admin) {
    throw new Error(`You are not the contract admin. Admin is ${onChainAdmin.substring(0, 5)}...${onChainAdmin.slice(-4)}`);
  }

  const signer = await getSigner();
  const client = getInvoiceClient(admin);
  const assembled = await client.revoke_kyc({ admin, investor });
  
  if (!assembled.built) {
    throw new Error('Failed to build revoke_kyc transaction.');
  }
  
  const sendResult = await assembled.signAndSend({ signTransaction: signer });
  const hash = extractTxHash(sendResult) || extractTxHash(assembled);
  return hash || 'success';
}

export async function checkKYCOnChain(investor: string): Promise<boolean> {
  const client = getInvoiceClient();
  const assembled = await client.is_kyc_approved({ investor });
  if (!assembled.result) return false;
  return assembled.result;
}
