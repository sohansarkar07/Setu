import { Client as InvoiceClient, networks as invoiceNetworks } from 'invoice-client';
import { Client as TokenClient, networks as tokenNetworks } from 'token-client';
import { isConnected, requestAccess, signTransaction, setAllowed } from '@stellar/freighter-api';
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
export async function signAndSubmit(xdrString: string, publicKey: string): Promise<string> {
  // Sign the transaction via Freighter
  const signedResponse = await signTransaction(xdrString, {
    network: 'TESTNET',
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  
  if (signedResponse.error) {
    throw new Error(`Transaction Rejected by User: ${signedResponse.error}`);
  }

  // Submit to network
  const tx = xdr.TransactionEnvelope.fromXDR(signedResponse.signedTx, 'base64');
  let response = await server.sendTransaction(tx);
  
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
  
  const hash = await signAndSubmit(tx.built.toXDR(), supplier);
  // Re-fetch to get the return value (invoice ID)
  // Since we don't strictly need it for the mock UI right now, we just return the hash
  return hash;
}

export async function verifyInvoiceOnChain(buyer: string, invoice_id: bigint) {
  const tx = await invoiceClient.verify_invoice({ buyer, invoice_id });
  if (!tx.built) throw new Error("Failed to build transaction");
  return await signAndSubmit(tx.built.toXDR(), buyer);
}

export async function fundInvoiceOnChain(investor: string, invoice_id: bigint) {
  const tx = await invoiceClient.fund_invoice({ investor, invoice_id });
  if (!tx.built) throw new Error("Failed to build transaction");
  return await signAndSubmit(tx.built.toXDR(), investor);
}
