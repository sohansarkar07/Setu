#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Vec,
    log, panic_with_error,
};

// ─── Error Codes ────────────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum SetuError {
    NotAuthorized = 1,
    InvoiceNotFound = 2,
    InvalidStatus = 3,
    KycNotApproved = 4,
    InvalidAmount = 5,
    AlreadyInitialized = 6,
    InvoiceAlreadyVerified = 7,
    InvoiceAlreadyFunded = 8,
}

// ─── Data Types ─────────────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InvoiceStatus {
    Draft,
    Verified,
    Funded,
    Paid,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Invoice {
    pub id: u64,
    pub supplier: Address,
    pub buyer: Address,
    pub amount: i128,
    pub description: String,
    pub due_date: u64,
    pub status: InvoiceStatus,
    pub investor: Address,
    pub created_at: u64,
    pub verified_at: u64,
    pub funded_at: u64,
}

// ─── Storage Keys ───────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Admin,
    InvoiceCount,
    Invoice(u64),
    KycApproved(Address),
    TokenContract,
}

// ─── Contract ───────────────────────────────────────────────────────────────────
#[contract]
pub struct SetuInvoiceContract;

#[contractimpl]
impl SetuInvoiceContract {
    /// Initialize the contract with an admin address and optional token contract
    pub fn initialize(env: Env, admin: Address, token_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        
        admin.require_auth();
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::InvoiceCount, &0u64);
        env.storage().instance().set(&DataKey::TokenContract, &token_contract);
        
        log!(&env, "Setu Invoice Contract initialized by admin: {}", admin);
        
        // Emit event
        env.events().publish(
            (symbol_short!("init"),),
            admin,
        );
    }

    /// Mint a new draft invoice (called by supplier)
    pub fn mint_invoice(
        env: Env,
        supplier: Address,
        buyer: Address,
        amount: i128,
        description: String,
        due_date: u64,
    ) -> u64 {
        supplier.require_auth();
        
        if amount <= 0 {
            panic!("Invalid amount: must be positive");
        }

        // Increment counter
        let mut count: u64 = env.storage().instance().get(&DataKey::InvoiceCount).unwrap_or(0);
        count += 1;

        let invoice = Invoice {
            id: count,
            supplier: supplier.clone(),
            buyer: buyer.clone(),
            amount,
            description,
            due_date,
            status: InvoiceStatus::Draft,
            investor: supplier.clone(), // placeholder
            created_at: env.ledger().timestamp(),
            verified_at: 0,
            funded_at: 0,
        };

        env.storage().instance().set(&DataKey::Invoice(count), &invoice);
        env.storage().instance().set(&DataKey::InvoiceCount, &count);

        log!(&env, "Invoice {} minted by supplier {}", count, supplier);
        
        // Emit event
        env.events().publish(
            (symbol_short!("mint"), supplier),
            (count, amount),
        );

        count
    }

    /// Verify an invoice (called by buyer) - Digital Handshake
    pub fn verify_invoice(env: Env, buyer: Address, invoice_id: u64) {
        buyer.require_auth();

        let mut invoice: Invoice = env.storage().instance()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        // Only the designated buyer can verify
        if invoice.buyer != buyer {
            panic!("Not authorized: only the designated buyer can verify");
        }

        // Must be in Draft status
        if invoice.status != InvoiceStatus::Draft {
            panic!("Invalid status: invoice must be in Draft status to verify");
        }

        invoice.status = InvoiceStatus::Verified;
        invoice.verified_at = env.ledger().timestamp();

        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        log!(&env, "Invoice {} verified by buyer {}", invoice_id, buyer);
        
        // Emit event
        env.events().publish(
            (symbol_short!("verify"), buyer),
            invoice_id,
        );
    }

    /// Fund an invoice (called by investor) - requires KYC
    pub fn fund_invoice(env: Env, investor: Address, invoice_id: u64) {
        investor.require_auth();

        // Check KYC
        let is_approved: bool = env.storage().instance()
            .get(&DataKey::KycApproved(investor.clone()))
            .unwrap_or(false);
        
        if !is_approved {
            panic!("KYC not approved: investor must be KYC verified");
        }

        let mut invoice: Invoice = env.storage().instance()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        // Must be Verified
        if invoice.status != InvoiceStatus::Verified {
            panic!("Invalid status: invoice must be Verified to fund");
        }

        invoice.status = InvoiceStatus::Funded;
        invoice.investor = investor.clone();
        invoice.funded_at = env.ledger().timestamp();

        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        log!(&env, "Invoice {} funded by investor {} for amount {}", invoice_id, investor, invoice.amount);
        
        // Emit event
        env.events().publish(
            (symbol_short!("fund"), investor),
            (invoice_id, invoice.amount),
        );
    }

    /// Approve KYC for an investor (admin only)
    pub fn approve_kyc(env: Env, admin: Address, investor: Address) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        
        if admin != stored_admin {
            panic!("Not authorized: only admin can approve KYC");
        }

        env.storage().instance().set(&DataKey::KycApproved(investor.clone()), &true);

        log!(&env, "KYC approved for investor {} by admin {}", investor, admin);
        
        // Emit event
        env.events().publish(
            (symbol_short!("kyc"), admin),
            investor,
        );
    }

    /// Revoke KYC for an investor (admin only)
    pub fn revoke_kyc(env: Env, admin: Address, investor: Address) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        
        if admin != stored_admin {
            panic!("Not authorized: only admin can revoke KYC");
        }

        env.storage().instance().set(&DataKey::KycApproved(investor.clone()), &false);

        log!(&env, "KYC revoked for investor {} by admin {}", investor, admin);
        
        env.events().publish(
            (symbol_short!("kyc_rev"), admin),
            investor,
        );
    }

    // ─── View Functions ─────────────────────────────────────────────────────────

    /// Get an invoice by ID
    pub fn get_invoice(env: Env, invoice_id: u64) -> Invoice {
        env.storage().instance()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found")
    }

    /// Get total number of invoices
    pub fn get_invoice_count(env: Env) -> u64 {
        env.storage().instance()
            .get(&DataKey::InvoiceCount)
            .unwrap_or(0)
    }

    /// Check if an investor is KYC approved
    pub fn is_kyc_approved(env: Env, investor: Address) -> bool {
        env.storage().instance()
            .get(&DataKey::KycApproved(investor))
            .unwrap_or(false)
    }

    /// Get admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized")
    }

    /// Mark invoice as paid (admin or buyer)
    pub fn mark_paid(env: Env, caller: Address, invoice_id: u64) {
        caller.require_auth();

        let mut invoice: Invoice = env.storage().instance()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        if invoice.status != InvoiceStatus::Funded {
            panic!("Invalid status: invoice must be Funded to mark as paid");
        }

        // Only admin or buyer can mark as paid
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        
        if caller != admin && caller != invoice.buyer {
            panic!("Not authorized: only admin or buyer can mark as paid");
        }

        invoice.status = InvoiceStatus::Paid;
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        log!(&env, "Invoice {} marked as paid", invoice_id);
        
        env.events().publish(
            (symbol_short!("paid"), caller),
            invoice_id,
        );
    }
}

// ─── Tests ──────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuInvoiceContract, ());
        let client = SetuInvoiceContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        
        client.initialize(&admin, &token);
        
        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_invoice_count(), 0);
    }

    #[test]
    fn test_mint_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuInvoiceContract, ());
        let client = SetuInvoiceContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        
        client.initialize(&admin, &token);
        
        let invoice_id = client.mint_invoice(
            &supplier,
            &buyer,
            &1000_i128,
            &String::from_str(&env, "Web Dev Services"),
            &1700000000_u64,
        );
        
        assert_eq!(invoice_id, 1);
        assert_eq!(client.get_invoice_count(), 1);
        
        let invoice = client.get_invoice(&1);
        assert_eq!(invoice.amount, 1000);
        assert_eq!(invoice.status, InvoiceStatus::Draft);
        assert_eq!(invoice.supplier, supplier);
        assert_eq!(invoice.buyer, buyer);
    }

    #[test]
    fn test_verify_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuInvoiceContract, ());
        let client = SetuInvoiceContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        
        client.initialize(&admin, &token);
        client.mint_invoice(
            &supplier,
            &buyer,
            &1000_i128,
            &String::from_str(&env, "Invoice 1"),
            &1700000000_u64,
        );
        
        client.verify_invoice(&buyer, &1);
        
        let invoice = client.get_invoice(&1);
        assert_eq!(invoice.status, InvoiceStatus::Verified);
    }

    #[test]
    fn test_fund_invoice_with_kyc() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuInvoiceContract, ());
        let client = SetuInvoiceContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        
        client.initialize(&admin, &token);
        client.mint_invoice(
            &supplier,
            &buyer,
            &5000_i128,
            &String::from_str(&env, "Invoice for funding"),
            &1700000000_u64,
        );
        
        // Verify
        client.verify_invoice(&buyer, &1);
        
        // Approve KYC
        client.approve_kyc(&admin, &investor);
        assert!(client.is_kyc_approved(&investor));
        
        // Fund
        client.fund_invoice(&investor, &1);
        
        let invoice = client.get_invoice(&1);
        assert_eq!(invoice.status, InvoiceStatus::Funded);
        assert_eq!(invoice.investor, investor);
    }

    #[test]
    #[should_panic(expected = "KYC not approved")]
    fn test_fund_without_kyc_fails() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuInvoiceContract, ());
        let client = SetuInvoiceContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        
        client.initialize(&admin, &token);
        client.mint_invoice(
            &supplier,
            &buyer,
            &1000_i128,
            &String::from_str(&env, "Test invoice"),
            &1700000000_u64,
        );
        
        client.verify_invoice(&buyer, &1);
        
        // Try to fund without KYC - should panic
        client.fund_invoice(&investor, &1);
    }

    #[test]
    fn test_full_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuInvoiceContract, ());
        let client = SetuInvoiceContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        
        // 1. Initialize
        client.initialize(&admin, &token);
        
        // 2. Mint invoice
        let id = client.mint_invoice(
            &supplier,
            &buyer,
            &10000_i128,
            &String::from_str(&env, "Full lifecycle test"),
            &1700000000_u64,
        );
        assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Draft);
        
        // 3. Verify invoice (buyer)
        client.verify_invoice(&buyer, &id);
        assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Verified);
        
        // 4. Approve KYC (admin)
        client.approve_kyc(&admin, &investor);
        
        // 5. Fund invoice (investor)
        client.fund_invoice(&investor, &id);
        assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Funded);
        
        // 6. Mark as paid
        client.mark_paid(&buyer, &id);
        assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Paid);
    }
}
