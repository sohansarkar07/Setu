#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String,
    token::{self, Interface as _},
    log,
};
use soroban_token_sdk::metadata::TokenMetadata;
use soroban_token_sdk::TokenUtils;

// ─── Storage Keys ───────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Admin,
    Allowance(Address, Address),
    Balance(Address),
    Authorized(Address),
    TotalSupply,
}

// ─── Contract ───────────────────────────────────────────────────────────────────
#[contract]
pub struct SetuTokenContract;

#[contractimpl]
impl SetuTokenContract {
    /// Initialize the sUSDC token
    pub fn initialize(env: Env, admin: Address, decimal: u32, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        
        admin.require_auth();
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &0_i128);

        TokenUtils::new(&env).metadata().set_metadata(&TokenMetadata {
            decimal,
            name,
            symbol,
        });

        log!(&env, "sUSDC Token initialized by admin: {}", admin);
        
        env.events().publish(
            (symbol_short!("init"),),
            admin,
        );
    }

    /// Mint tokens to an address (admin only)
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        let mut balance: i128 = env.storage().instance()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        balance += amount;
        env.storage().instance().set(&DataKey::Balance(to.clone()), &balance);

        let mut supply: i128 = env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        supply += amount;
        env.storage().instance().set(&DataKey::TotalSupply, &supply);

        log!(&env, "Minted {} sUSDC to {}", amount, to);
        
        env.events().publish(
            (symbol_short!("mint"), admin),
            (to, amount),
        );
    }

    /// Transfer tokens from one address to another
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Check authorization
        let from_authorized: bool = env.storage().instance()
            .get(&DataKey::Authorized(from.clone()))
            .unwrap_or(true); // default authorized for non-gated transfers

        if !from_authorized {
            panic!("Not authorized: sender is not authorized");
        }

        let mut from_balance: i128 = env.storage().instance()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        from_balance -= amount;
        env.storage().instance().set(&DataKey::Balance(from.clone()), &from_balance);

        let mut to_balance: i128 = env.storage().instance()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        to_balance += amount;
        env.storage().instance().set(&DataKey::Balance(to.clone()), &to_balance);

        log!(&env, "Transfer {} sUSDC from {} to {}", amount, from, to);
        
        env.events().publish(
            (symbol_short!("xfer"), from),
            (to, amount),
        );
    }

    /// Set authorization for an address (admin only - KYC gate)
    pub fn set_authorized(env: Env, addr: Address, authorized: bool) {
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        env.storage().instance().set(&DataKey::Authorized(addr.clone()), &authorized);

        log!(&env, "Authorization for {} set to {}", addr, authorized);
        
        env.events().publish(
            (symbol_short!("auth"), admin),
            (addr, authorized),
        );
    }

    // ─── View functions ─────────────────────────────────────────────────────────

    pub fn balance(env: Env, addr: Address) -> i128 {
        env.storage().instance()
            .get(&DataKey::Balance(addr))
            .unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    pub fn is_authorized(env: Env, addr: Address) -> bool {
        env.storage().instance()
            .get(&DataKey::Authorized(addr))
            .unwrap_or(false)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Not initialized")
    }
}

// ─── Tests ──────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize_token() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuTokenContract, ());
        let client = SetuTokenContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        
        client.initialize(
            &admin,
            &7_u32,
            &String::from_str(&env, "Setu USDC"),
            &String::from_str(&env, "sUSDC"),
        );
        
        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    fn test_mint_and_transfer() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuTokenContract, ());
        let client = SetuTokenContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let user_a = Address::generate(&env);
        let user_b = Address::generate(&env);
        
        client.initialize(
            &admin,
            &7_u32,
            &String::from_str(&env, "Setu USDC"),
            &String::from_str(&env, "sUSDC"),
        );
        
        // Mint to user_a
        client.mint(&user_a, &10000_i128);
        assert_eq!(client.balance(&user_a), 10000);
        assert_eq!(client.total_supply(), 10000);
        
        // Transfer from user_a to user_b
        client.transfer(&user_a, &user_b, &3000_i128);
        assert_eq!(client.balance(&user_a), 7000);
        assert_eq!(client.balance(&user_b), 3000);
    }

    #[test]
    fn test_authorization() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register(SetuTokenContract, ());
        let client = SetuTokenContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let investor = Address::generate(&env);
        
        client.initialize(
            &admin,
            &7_u32,
            &String::from_str(&env, "Setu USDC"),
            &String::from_str(&env, "sUSDC"),
        );
        
        // By default, not explicitly authorized
        assert!(!client.is_authorized(&investor));
        
        // Admin authorizes investor
        client.set_authorized(&investor, &true);
        assert!(client.is_authorized(&investor));
        
        // Admin revokes
        client.set_authorized(&investor, &false);
        assert!(!client.is_authorized(&investor));
    }
}
