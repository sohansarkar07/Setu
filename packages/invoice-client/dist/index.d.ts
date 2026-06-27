import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CDWDT2VG2LSHG6D2JIEPN43UWF6NF3K5VV5RGDNIT2KF5NJJ3BWZEZIM";
    };
};
export type DataKey = {
    tag: "Admin";
    values: void;
} | {
    tag: "InvoiceCount";
    values: void;
} | {
    tag: "Invoice";
    values: readonly [u64];
} | {
    tag: "KycApproved";
    values: readonly [string];
} | {
    tag: "TokenContract";
    values: void;
};
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
export declare enum SetuError {
    NotAuthorized = 1,
    InvoiceNotFound = 2,
    InvalidStatus = 3,
    KycNotApproved = 4,
    InvalidAmount = 5,
    AlreadyInitialized = 6,
    InvoiceAlreadyVerified = 7,
    InvoiceAlreadyFunded = 8
}
export type InvoiceStatus = {
    tag: "Draft";
    values: void;
} | {
    tag: "Verified";
    values: void;
} | {
    tag: "Funded";
    values: void;
} | {
    tag: "Paid";
    values: void;
} | {
    tag: "Defaulted";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Get admin address
     */
    get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>;
    /**
     * Construct and simulate a mark_paid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Mark invoice as paid (admin or buyer)
     */
    mark_paid: ({ caller, invoice_id }: {
        caller: string;
        invoice_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Initialize the contract with an admin address and optional token contract
     */
    initialize: ({ admin, token_contract }: {
        admin: string;
        token_contract: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a revoke_kyc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Revoke KYC for an investor (admin only)
     */
    revoke_kyc: ({ admin, investor }: {
        admin: string;
        investor: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a approve_kyc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Approve KYC for an investor (admin only)
     */
    approve_kyc: ({ admin, investor }: {
        admin: string;
        investor: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Get an invoice by ID
     */
    get_invoice: ({ invoice_id }: {
        invoice_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Invoice>>;
    /**
     * Construct and simulate a fund_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Fund an invoice (called by investor) - requires KYC
     */
    fund_invoice: ({ investor, invoice_id }: {
        investor: string;
        invoice_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a mint_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Mint a new draft invoice (called by supplier)
     */
    mint_invoice: ({ supplier, buyer, amount, description, due_date }: {
        supplier: string;
        buyer: string;
        amount: i128;
        description: string;
        due_date: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a verify_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Verify an invoice (called by buyer) - Digital Handshake
     */
    verify_invoice: ({ buyer, invoice_id }: {
        buyer: string;
        invoice_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a is_kyc_approved transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Check if an investor is KYC approved
     */
    is_kyc_approved: ({ investor }: {
        investor: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>;
    /**
     * Construct and simulate a get_invoice_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Get total number of invoices
     */
    get_invoice_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        get_admin: (json: string) => AssembledTransaction<string>;
        mark_paid: (json: string) => AssembledTransaction<null>;
        initialize: (json: string) => AssembledTransaction<null>;
        revoke_kyc: (json: string) => AssembledTransaction<null>;
        approve_kyc: (json: string) => AssembledTransaction<null>;
        get_invoice: (json: string) => AssembledTransaction<Invoice>;
        fund_invoice: (json: string) => AssembledTransaction<null>;
        mint_invoice: (json: string) => AssembledTransaction<bigint>;
        verify_invoice: (json: string) => AssembledTransaction<null>;
        is_kyc_approved: (json: string) => AssembledTransaction<boolean>;
        get_invoice_count: (json: string) => AssembledTransaction<bigint>;
    };
}
