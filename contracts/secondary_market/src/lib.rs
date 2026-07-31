#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, 
    panic_with_error, token, String
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum SecondaryMarketError {
    NotAuthorized = 1,
    ListingNotFound = 2,
    InvalidPrice = 3,
    AlreadyInitialized = 4,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Listing {
    pub invoice_id: u64,
    pub seller: Address,
    pub price: i128,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    TokenContract,
    Listings(u64), // Keyed by invoice_id
}

#[contract]
pub struct SecondaryMarketContract;

#[contractimpl]
impl SecondaryMarketContract {
    pub fn initialize(env: Env, admin: Address, token_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, SecondaryMarketError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenContract, &token_contract);
    }

    pub fn list_invoice(env: Env, seller: Address, invoice_id: u64, price: i128) {
        seller.require_auth();
        if price <= 0 {
            panic_with_error!(&env, SecondaryMarketError::InvalidPrice);
        }

        let listing = Listing {
            invoice_id,
            seller,
            price,
            active: true,
        };
        env.storage().persistent().set(&DataKey::Listings(invoice_id), &listing);
    }

    pub fn cancel_listing(env: Env, seller: Address, invoice_id: u64) {
        seller.require_auth();
        let key = DataKey::Listings(invoice_id);
        if let Some(mut listing) = env.storage().persistent().get::<_, Listing>(&key) {
            if listing.seller != seller {
                panic_with_error!(&env, SecondaryMarketError::NotAuthorized);
            }
            listing.active = false;
            env.storage().persistent().set(&key, &listing);
        } else {
            panic_with_error!(&env, SecondaryMarketError::ListingNotFound);
        }
    }

    pub fn buy_invoice(env: Env, buyer: Address, invoice_id: u64) {
        buyer.require_auth();
        let key = DataKey::Listings(invoice_id);
        
        let mut listing: Listing = env.storage().persistent().get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, SecondaryMarketError::ListingNotFound));

        if !listing.active {
            panic_with_error!(&env, SecondaryMarketError::ListingNotFound);
        }

        let token_contract: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        let token_client = token::Client::new(&env, &token_contract);

        // Transfer funds from buyer to seller
        token_client.transfer(&buyer, &listing.seller, &listing.price);

        // Mark listing as inactive
        listing.active = false;
        env.storage().persistent().set(&key, &listing);
        
        // Note: The actual transfer of invoice ownership should be handled by calling 
        // the invoice contract's `transfer_ownership` method in a real composed tx.
    }
    
    pub fn get_listing(env: Env, invoice_id: u64) -> Listing {
        env.storage().persistent().get(&DataKey::Listings(invoice_id))
            .unwrap_or_else(|| panic_with_error!(&env, SecondaryMarketError::ListingNotFound))
    }
}
