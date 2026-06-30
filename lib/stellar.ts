/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Horizon,
  Networks,
  StrKey,
  BASE_FEE,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Transaction,
} from '@stellar/stellar-sdk';

export const NETWORK = 'TESTNET';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';

// Contract IDs - deployed on testnet
export const INVOICE_CONTRACT_ID = process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ID || '';
export const TOKEN_CONTRACT_ID = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID || '';

export const server = new Horizon.Server(HORIZON_URL);

export async function getAccountBalance(publicKey: string): Promise<{xlm: string, tokens: {asset: string, balance: string}[]}> {
  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === 'native'
    );
    
    const tokens = account.balances
      .filter((b: { asset_type: string }) => b.asset_type !== 'native')
      .map((b: { asset_type: string; balance: string; asset_code?: string }) => ({
        asset: b.asset_code || 'Unknown',
        balance: b.balance
      }));

    return {
      xlm: xlmBalance?.balance || '0',
      tokens
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'response' in error) {
      const stellarError = error as { response?: { status?: number } };
      if (stellarError.response?.status === 404) {
        // Account not funded yet
        return { xlm: '0', tokens: [] };
      }
    }
    throw error;
  }
}

export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    if (!response.ok) {
      throw new Error('Friendbot funding failed');
    }
    return true;
  } catch (error) {
    console.error('Friendbot error:', error);
    return false;
  }
}

export async function sendXLMTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  memo?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    // Validate destination
    if (!StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
      return { success: false, error: 'Invalid destination address' };
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return { success: false, error: 'Invalid amount - must be a positive number' };
    }

    const sourceAccount = await server.loadAccount(sourcePublicKey);
    
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Check if destination exists
    let destinationExists = true;
    try {
      await server.loadAccount(destinationPublicKey);
    } catch {
      destinationExists = false;
    }

    if (destinationExists) {
      transactionBuilder.addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: Asset.native(),
          amount: amount,
        })
      );
    } else {
      transactionBuilder.addOperation(
        Operation.createAccount({
          destination: destinationPublicKey,
          startingBalance: amount,
        })
      );
    }

    if (memo) {
      transactionBuilder.addMemo(Memo.text(memo));
    }

    const transaction = transactionBuilder
      .setTimeout(30)
      .build();

    // Use Freighter to sign
    const { signTransaction } = await import('@stellar/freighter-api');
    const signedXDR = await signTransaction(transaction.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const signedTransaction = TransactionBuilder.fromXDR(
      typeof signedXDR === 'string' ? signedXDR : signedXDR.signedTxXdr,
      NETWORK_PASSPHRASE
    );

    const result = await server.submitTransaction(signedTransaction as Transaction);
    
    return {
      success: true,
      hash: result.hash,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transaction failed';
    return { success: false, error: message };
  }
}

export async function getTransactionHistory(publicKey: string) {
  try {
    const transactions = await server
      .transactions()
      .forAccount(publicKey)
      .order('desc')
      .limit(10)
      .call();

    return transactions.records.map((tx: { hash: string; created_at: string; successful: boolean; memo?: string; fee_charged: string; source_account: string }) => ({
      hash: tx.hash,
      createdAt: tx.created_at,
      successful: tx.successful,
      memo: tx.memo,
      feeCharged: tx.fee_charged,
      sourceAccount: tx.source_account,
    }));
  } catch {
    return [];
  }
}

export function shortenAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatXLM(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

// Mock functions for UI demonstrations

export async function verifyInvoiceSignature(
  _publicKey: string,
  _invoiceId: string,
  _memo?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, hash: `mock_verify_${Date.now()}` };
}

export async function fundInvoice(
  _publicKey: string,
  _supplierAddress: string,
  _amount: string,
  _memo?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, hash: `mock_fund_${Date.now()}` };
}

export async function addKYC(
  _adminPublicKey: string,
  _investorPublicKey: string,
  _memo?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, hash: `mock_kyc_add_${Date.now()}` };
}

export async function removeKYC(
  _adminPublicKey: string,
  _investorPublicKey: string,
  _memo?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, hash: `mock_kyc_rm_${Date.now()}` };
}

