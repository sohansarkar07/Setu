#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, 
    panic_with_error, token
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ReservePoolError {
    NotAuthorized = 1,
    InsufficientFunds = 2,
    AlreadyInitialized = 3,
}

#[contracttype]
pub enum DataKey {
    Admin,
    TokenContract,
}

#[contract]
pub struct ReservePoolContract;

#[contractimpl]
impl ReservePoolContract {
    pub fn initialize(env: Env, admin: Address, token_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, ReservePoolError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenContract, &token_contract);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let token_contract: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        let token_client = token::Client::new(&env, &token_contract);
        
        let contract_address = env.current_contract_address();
        token_client.transfer(&from, &contract_address, &amount);
    }

    pub fn payout(env: Env, admin: Address, to: Address, amount: i128) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic_with_error!(&env, ReservePoolError::NotAuthorized);
        }

        let token_contract: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        let token_client = token::Client::new(&env, &token_contract);
        
        let contract_address = env.current_contract_address();
        let balance = token_client.balance(&contract_address);
        
        if balance < amount {
            panic_with_error!(&env, ReservePoolError::InsufficientFunds);
        }

        token_client.transfer(&contract_address, &to, &amount);
    }

    pub fn get_balance(env: Env) -> i128 {
        let token_contract: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        let token_client = token::Client::new(&env, &token_contract);
        token_client.balance(&env.current_contract_address())
    }
}
