import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
};
export var SetuError;
(function (SetuError) {
    SetuError[SetuError["NotAuthorized"] = 1] = "NotAuthorized";
    SetuError[SetuError["InvoiceNotFound"] = 2] = "InvoiceNotFound";
    SetuError[SetuError["InvalidStatus"] = 3] = "InvalidStatus";
    SetuError[SetuError["KycNotApproved"] = 4] = "KycNotApproved";
    SetuError[SetuError["InvalidAmount"] = 5] = "InvalidAmount";
    SetuError[SetuError["AlreadyInitialized"] = 6] = "AlreadyInitialized";
    SetuError[SetuError["InvoiceAlreadyVerified"] = 7] = "InvoiceAlreadyVerified";
    SetuError[SetuError["InvoiceAlreadyFunded"] = 8] = "InvoiceAlreadyFunded";
})(SetuError || (SetuError = {}));
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAABFHZXQgYWRtaW4gYWRkcmVzcwAAAAAAAAlnZXRfYWRtaW4AAAAAAAAAAAAAAQAAABM=",
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
            "AAAAAAAAABxHZXQgdG90YWwgbnVtYmVyIG9mIGludm9pY2VzAAAAEWdldF9pbnZvaWNlX2NvdW50AAAAAAAAAAAAAAEAAAAG"]), options);
        this.options = options;
    }
    fromJSON = {
        get_admin: (this.txFromJSON),
        mark_paid: (this.txFromJSON),
        initialize: (this.txFromJSON),
        revoke_kyc: (this.txFromJSON),
        approve_kyc: (this.txFromJSON),
        get_invoice: (this.txFromJSON),
        fund_invoice: (this.txFromJSON),
        mint_invoice: (this.txFromJSON),
        verify_invoice: (this.txFromJSON),
        is_kyc_approved: (this.txFromJSON),
        get_invoice_count: (this.txFromJSON)
    };
}
