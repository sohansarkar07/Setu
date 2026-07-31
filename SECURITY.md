# Setu v2 — Security Policy

## Supported Versions

| Version | Supported |
|:---|:---:|
| v2.x (current) | ✅ |
| v1.x (Level 3) | ⚠️ No new features |

## Reporting a Vulnerability

If you discover a security vulnerability in Setu's smart contracts or frontend, **please do NOT open a public GitHub issue**.

Instead, email the maintainer directly at the GitHub profile contact or open a [private security advisory](https://github.com/sohansarkar07/Setu/security/advisories/new).

We will respond within **48 hours** and work to patch critical issues within **7 days**.

## Smart Contract Security Notes

- All Soroban contract functions enforce `require_auth()` on privileged callers.
- KYC is enforced on-chain: `fund_invoice` panics if `is_kyc_approved` returns false.
- The `AUTHORIZATION_REQUIRED` flag on the sUSDC token prevents unauthorized transfers.
- The Reserve Pool contract only accepts deposits from the Invoice contract address.
- The Admin panel is restricted to the super-admin wallet `GA5B7EJJ...` — other wallets see "Access Denied".

## Frontend Security Notes

- No private keys or seed phrases ever touch the frontend codebase.
- All transaction signing is done exclusively inside the Freighter browser extension.
- The `GROQ_API_KEY` is stored as a server-side environment variable and never exposed to the client.
- API routes use server-side validation before forwarding to Groq.
