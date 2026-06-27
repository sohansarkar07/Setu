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
        contractId: "CCMEDRG2QBTQA27BPU4DAFOEWW2Q7WNINN6NZX4UUEBYBDJUG47THZP7",
    }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAACZNaW50IHRva2VucyB0byBhbiBhZGRyZXNzIChhZG1pbiBvbmx5KQAAAAAABG1pbnQAAAACAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAARhZGRyAAAAEwAAAAEAAAAL",
            "AAAAAAAAACtUcmFuc2ZlciB0b2tlbnMgZnJvbSBvbmUgYWRkcmVzcyB0byBhbm90aGVyAAAAAAh0cmFuc2ZlcgAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAJQWxsb3dhbmNlAAAAAAAAAgAAABMAAAATAAAAAQAAAAAAAAAHQmFsYW5jZQAAAAABAAAAEwAAAAEAAAAAAAAACkF1dGhvcml6ZWQAAAAAAAEAAAATAAAAAAAAAAAAAAALVG90YWxTdXBwbHkA",
            "AAAAAAAAABpJbml0aWFsaXplIHRoZSBzVVNEQyB0b2tlbgAAAAAACmluaXRpYWxpemUAAAAAAAQAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAHZGVjaW1hbAAAAAAEAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQAAAAAA==",
            "AAAAAAAAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
            "AAAAAAAAAAAAAAANaXNfYXV0aG9yaXplZAAAAAAAAAEAAAAAAAAABGFkZHIAAAATAAAAAQAAAAE=",
            "AAAAAAAAADhTZXQgYXV0aG9yaXphdGlvbiBmb3IgYW4gYWRkcmVzcyAoYWRtaW4gb25seSAtIEtZQyBnYXRlKQAAAA5zZXRfYXV0aG9yaXplZAAAAAAAAgAAAAAAAAAEYWRkcgAAABMAAAAAAAAACmF1dGhvcml6ZWQAAAAAAAEAAAAA",
            "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAADAAAAAAAAAAdkZWNpbWFsAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABA="]), options);
        this.options = options;
    }
    fromJSON = {
        mint: (this.txFromJSON),
        balance: (this.txFromJSON),
        transfer: (this.txFromJSON),
        get_admin: (this.txFromJSON),
        initialize: (this.txFromJSON),
        total_supply: (this.txFromJSON),
        is_authorized: (this.txFromJSON),
        set_authorized: (this.txFromJSON)
    };
}
