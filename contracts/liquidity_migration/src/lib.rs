use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, IntoVal, Symbol,
};

const TTL_THRESHOLD: u32 = 100_000;
const TTL_BUMP: u32 = 200_000;

#[contracttype]
#[derive(Clone)]
pub struct MigrationRecord {
    pub launch_id: u64,
    pub token_address: Address,
    pub xlm_amount: i128,
    pub migrated_at: u64,
    pub dex_offer_id: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    BondingCurve,
    LaunchContract,
    Migration(u64),
}

#[contract]
pub struct LiquidityMigrationContract;

#[contractimpl]
impl LiquidityMigrationContract {
    pub fn initialize(env: Env, admin: Address, bonding_curve: Address, launch_contract: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::BondingCurve, &bonding_curve);
        env.storage()
            .persistent()
            .set(&DataKey::LaunchContract, &launch_contract);
    }

    pub fn migrate(
        env: Env,
        launch_id: u64,
        token_address: Address,
        xlm_raised: i128,
        remaining_tokens: i128,
    ) {
        let bonding_curve: Address = env
            .storage()
            .persistent()
            .get(&DataKey::BondingCurve)
            .expect("not initialized");
        bonding_curve.require_auth();

        if remaining_tokens > 0 {
            let token_client = token::Client::new(&env, &token_address);
            token_client.burn(&env.current_contract_address(), &remaining_tokens);
        }

        let record = MigrationRecord {
            launch_id,
            token_address: token_address.clone(),
            xlm_amount: xlm_raised,
            migrated_at: env.ledger().timestamp(),
            dex_offer_id: 0, // DEX offer created by off-chain handler listening to event
        };

        env.storage()
            .persistent()
            .set(&DataKey::Migration(launch_id), &record);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Migration(launch_id), TTL_THRESHOLD, TTL_BUMP);

        // Emit event for off-chain DEX offer creation
        env.events().publish(
            (symbol_short!("migrated"), launch_id),
            (token_address, xlm_raised),
        );

        // Call launch_contract.mark_migrated
        let launch_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::LaunchContract)
            .expect("not initialized");
        env.invoke_contract::<()>(
            &launch_addr,
            &Symbol::new(&env, "mark_migrated"),
            soroban_sdk::vec![&env, launch_id.into_val(&env)],
        );
    }

    pub fn get_migration(env: Env, launch_id: u64) -> Option<MigrationRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::Migration(launch_id))
    }
}
