use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec,
};

const TTL_THRESHOLD: u32 = 100_000;
const TTL_BUMP: u32 = 200_000;

#[contracttype]
#[derive(Clone)]
pub enum LaunchStatus {
    Active,
    Migrated,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct LaunchData {
    pub token_address: Address,
    pub creator: Address,
    pub name: String,
    pub symbol: String,
    pub total_supply: i128,
    pub target_market_cap: i128,
    pub raised_xlm: i128,
    pub sold_tokens: i128,
    pub status: LaunchStatus,
    pub created_at: u64,
    pub description: String,
    pub image_url: String,
}

#[contracttype]
pub enum DataKey {
    Admin,
    BondingCurve,
    LaunchCount,
    Launch(u64),
}

#[contract]
pub struct LaunchContract;

#[contractimpl]
impl LaunchContract {
    pub fn initialize(env: Env, admin: Address, bonding_curve: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::BondingCurve, &bonding_curve);
        env.storage().persistent().set(&DataKey::LaunchCount, &0u64);
    }

    pub fn create_launch(
        env: Env,
        creator: Address,
        token_address: Address,
        name: String,
        symbol: String,
        description: String,
        image_url: String,
        total_supply: i128,
        target_market_cap: i128,
    ) -> u64 {
        creator.require_auth();

        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::LaunchCount)
            .unwrap_or(0);
        let launch_id = count + 1;

        let launch = LaunchData {
            token_address: token_address.clone(),
            creator: creator.clone(),
            name: name.clone(),
            symbol: symbol.clone(),
            total_supply,
            target_market_cap,
            raised_xlm: 0,
            sold_tokens: 0,
            status: LaunchStatus::Active,
            created_at: env.ledger().timestamp(),
            description,
            image_url,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Launch(launch_id), &launch);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Launch(launch_id), TTL_THRESHOLD, TTL_BUMP);

        env.storage()
            .persistent()
            .set(&DataKey::LaunchCount, &launch_id);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::LaunchCount, TTL_THRESHOLD, TTL_BUMP);

        env.events().publish(
            (symbol_short!("launched"), creator),
            (launch_id, token_address, name, symbol, total_supply),
        );

        launch_id
    }

    pub fn get_launch(env: Env, launch_id: u64) -> LaunchData {
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Launch(launch_id), TTL_THRESHOLD, TTL_BUMP);
        env.storage()
            .persistent()
            .get(&DataKey::Launch(launch_id))
            .expect("launch not found")
    }

    pub fn update_progress(env: Env, launch_id: u64, xlm_raised: i128, tokens_sold: i128) {
        let bonding_curve: Address = env
            .storage()
            .persistent()
            .get(&DataKey::BondingCurve)
            .expect("not initialized");
        bonding_curve.require_auth();

        let mut launch: LaunchData = env
            .storage()
            .persistent()
            .get(&DataKey::Launch(launch_id))
            .expect("launch not found");

        launch.raised_xlm = xlm_raised;
        launch.sold_tokens = tokens_sold;

        env.storage()
            .persistent()
            .set(&DataKey::Launch(launch_id), &launch);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Launch(launch_id), TTL_THRESHOLD, TTL_BUMP);

        env.events().publish(
            (symbol_short!("updated"), launch_id),
            (xlm_raised, tokens_sold),
        );
    }

    pub fn mark_migrated(env: Env, launch_id: u64) {
        let bonding_curve: Address = env
            .storage()
            .persistent()
            .get(&DataKey::BondingCurve)
            .expect("not initialized");
        bonding_curve.require_auth();

        let mut launch: LaunchData = env
            .storage()
            .persistent()
            .get(&DataKey::Launch(launch_id))
            .expect("launch not found");

        launch.status = LaunchStatus::Migrated;

        env.storage()
            .persistent()
            .set(&DataKey::Launch(launch_id), &launch);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Launch(launch_id), TTL_THRESHOLD, TTL_BUMP);

        env.events()
            .publish((symbol_short!("migrated"), launch_id), ());
    }

    pub fn get_launches(env: Env, offset: u32, limit: u32) -> Vec<LaunchData> {
        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::LaunchCount)
            .unwrap_or(0);
        let mut result = Vec::new(&env);
        let start = (offset as u64) + 1;
        let end = (start + limit as u64).min(count + 1);
        for id in start..end {
            if let Some(launch) = env
                .storage()
                .persistent()
                .get::<DataKey, LaunchData>(&DataKey::Launch(id))
            {
                result.push_back(launch);
            }
        }
        result
    }

    pub fn get_launch_count(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::LaunchCount)
            .unwrap_or(0)
    }
}
