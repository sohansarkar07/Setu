import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDWDT2VG2LSHG6D2JIEPN43UWF6NF3K5VV5RGDNIT2KF5NJJ3BWZEZIM",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "InvoiceCount", values: void} | {tag: "Invoice", values: readonly [u64]} | {tag: "KycApproved", values: readonly [string]} | {tag: "TokenContract", values: void};


export interface Invoice {
  amount: i128;
  buyer: string;
  created_at: u64;
  description: string;
  due_date: u64;
  funded_at: u64;
  id: u64;
  investor: string;
  status: InvoiceStatus;
  supplier: string;
  verified_at: u64;
}

export enum SetuError {
  NotAuthorized = 1,
  InvoiceNotFound = 2,
  InvalidStatus = 3,
  KycNotApproved = 4,
  InvalidAmount = 5,
  AlreadyInitialized = 6,
  InvoiceAlreadyVerified = 7,
  InvoiceAlreadyFunded = 8,
}

export type InvoiceStatus = {tag: "Draft", values: void} | {tag: "Verified", values: void} | {tag: "Funded", values: void} | {tag: "Paid", values: void} | {tag: "Defaulted", values: void};

export interface Client {
  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get admin address
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a mark_paid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mark invoice as paid (admin or buyer)
   */
  mark_paid: ({caller, invoice_id}: {caller: string, invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract with an admin address and optional token contract
   */
  initialize: ({admin, token_contract}: {admin: string, token_contract: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a revoke_kyc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke KYC for an investor (admin only)
   */
  revoke_kyc: ({admin, investor}: {admin: string, investor: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a approve_kyc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Approve KYC for an investor (admin only)
   */
  approve_kyc: ({admin, investor}: {admin: string, investor: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get an invoice by ID
   */
  get_invoice: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Invoice>>

  /**
   * Construct and simulate a fund_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fund an invoice (called by investor) - requires KYC
   */
  fund_invoice: ({investor, invoice_id}: {investor: string, invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mint_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mint a new draft invoice (called by supplier)
   */
  mint_invoice: ({supplier, buyer, amount, description, due_date}: {supplier: string, buyer: string, amount: i128, description: string, due_date: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a verify_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify an invoice (called by buyer) - Digital Handshake
   */
  verify_invoice: ({buyer, invoice_id}: {buyer: string, invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_kyc_approved transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if an investor is KYC approved
   */
  is_kyc_approved: ({investor}: {investor: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_invoice_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of invoices
   */
  get_invoice_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAABFHZXQgYWRtaW4gYWRkcmVzcwAAAAAAAAlnZXRfYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAACVNYXJrIGludm9pY2UgYXMgcGFpZCAoYWRtaW4gb3IgYnV5ZXIpAAAAAAAACW1hcmtfcGFpZAAAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAKaW52b2ljZV9pZAAAAAAABgAAAAA=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMSW52b2ljZUNvdW50AAAAAQAAAAAAAAAHSW52b2ljZQAAAAABAAAABgAAAAEAAAAAAAAAC0t5Y0FwcHJvdmVkAAAAAAEAAAATAAAAAAAAAAAAAAANVG9rZW5Db250cmFjdAAAAA==",
        "AAAAAQAAAAAAAAAAAAAAB0ludm9pY2UAAAAACwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAACGR1ZV9kYXRlAAAABgAAAAAAAAAJZnVuZGVkX2F0AAAAAAAABgAAAAAAAAACaWQAAAAAAAYAAAAAAAAACGludmVzdG9yAAAAEwAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADUludm9pY2VTdGF0dXMAAAAAAAAAAAAACHN1cHBsaWVyAAAAEwAAAAAAAAALdmVyaWZpZWRfYXQAAAAABg==",
        "AAAAAAAAAElJbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIGFuIGFkbWluIGFkZHJlc3MgYW5kIG9wdGlvbmFsIHRva2VuIGNvbnRyYWN0AAAAAAAACmluaXRpYWxpemUAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAOdG9rZW5fY29udHJhY3QAAAAAABMAAAAA",
        "AAAAAAAAACdSZXZva2UgS1lDIGZvciBhbiBpbnZlc3RvciAoYWRtaW4gb25seSkAAAAACnJldm9rZV9reWMAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIaW52ZXN0b3IAAAATAAAAAA==",
        "AAAAAAAAAChBcHByb3ZlIEtZQyBmb3IgYW4gaW52ZXN0b3IgKGFkbWluIG9ubHkpAAAAC2FwcHJvdmVfa3ljAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIaW52ZXN0b3IAAAATAAAAAA==",
        "AAAAAAAAABRHZXQgYW4gaW52b2ljZSBieSBJRAAAAAtnZXRfaW52b2ljZQAAAAABAAAAAAAAAAppbnZvaWNlX2lkAAAAAAAGAAAAAQAAB9AAAAAHSW52b2ljZQA=",
        "AAAAAwAAAAAAAAAAAAAACVNldHVFcnJvcgAAAAAAAAgAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAABAAAAAAAAAA9JbnZvaWNlTm90Rm91bmQAAAAAAgAAAAAAAAANSW52YWxpZFN0YXR1cwAAAAAAAAMAAAAAAAAADkt5Y05vdEFwcHJvdmVkAAAAAAAEAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAAGAAAAAAAAABZJbnZvaWNlQWxyZWFkeVZlcmlmaWVkAAAAAAAHAAAAAAAAABRJbnZvaWNlQWxyZWFkeUZ1bmRlZAAAAAg=",
        "AAAAAAAAADNGdW5kIGFuIGludm9pY2UgKGNhbGxlZCBieSBpbnZlc3RvcikgLSByZXF1aXJlcyBLWUMAAAAADGZ1bmRfaW52b2ljZQAAAAIAAAAAAAAACGludmVzdG9yAAAAEwAAAAAAAAAKaW52b2ljZV9pZAAAAAAABgAAAAA=",
        "AAAAAAAAAC1NaW50IGEgbmV3IGRyYWZ0IGludm9pY2UgKGNhbGxlZCBieSBzdXBwbGllcikAAAAAAAAMbWludF9pbnZvaWNlAAAABQAAAAAAAAAIc3VwcGxpZXIAAAATAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAIZHVlX2RhdGUAAAAGAAAAAQAAAAY=",
        "AAAAAAAAADdWZXJpZnkgYW4gaW52b2ljZSAoY2FsbGVkIGJ5IGJ1eWVyKSAtIERpZ2l0YWwgSGFuZHNoYWtlAAAAAA52ZXJpZnlfaW52b2ljZQAAAAAAAgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAAAAAAppbnZvaWNlX2lkAAAAAAAGAAAAAA==",
        "AAAAAAAAACRDaGVjayBpZiBhbiBpbnZlc3RvciBpcyBLWUMgYXBwcm92ZWQAAAAPaXNfa3ljX2FwcHJvdmVkAAAAAAEAAAAAAAAACGludmVzdG9yAAAAEwAAAAEAAAAB",
        "AAAAAgAAAAAAAAAAAAAADUludm9pY2VTdGF0dXMAAAAAAAAFAAAAAAAAAAAAAAAFRHJhZnQAAAAAAAAAAAAAAAAAAAhWZXJpZmllZAAAAAAAAAAAAAAABkZ1bmRlZAAAAAAAAAAAAAAAAAAEUGFpZAAAAAAAAAAAAAAACURlZmF1bHRlZAAAAA==",
        "AAAAAAAAABxHZXQgdG90YWwgbnVtYmVyIG9mIGludm9pY2VzAAAAEWdldF9pbnZvaWNlX2NvdW50AAAAAAAAAAAAAAEAAAAG" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_admin: this.txFromJSON<string>,
        mark_paid: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>,
        revoke_kyc: this.txFromJSON<null>,
        approve_kyc: this.txFromJSON<null>,
        get_invoice: this.txFromJSON<Invoice>,
        fund_invoice: this.txFromJSON<null>,
        mint_invoice: this.txFromJSON<u64>,
        verify_invoice: this.txFromJSON<null>,
        is_kyc_approved: this.txFromJSON<boolean>,
        get_invoice_count: this.txFromJSON<u64>
  }
}