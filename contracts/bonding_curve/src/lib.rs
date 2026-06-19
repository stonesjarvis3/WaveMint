use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, IntoVal, Symbol,
};

const TTL_THRESHOLD: u32 = 100_000;
const TTL_BUMP: u32 = 200_000;

#[contracttype]
#[derive(Clone)]
pub struct CurveState {
    pub raised_xlm: i128,
    pub sold_tokens: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    LaunchContract,
    MigrationContract,
    VirtualXlm,
    VirtualTokens,
    Curve(u64),
}

#[contract]
pub struct BondingCurveContract;

#[contractimpl]
impl BondingCurveContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        launch_contract: Address,
        migration_contract: Address,
        virtual_xlm: i128,
        virtual_tokens: i128,
    ) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::LaunchContract, &launch_contract);
        env.storage()
            .persistent()
            .set(&DataKey::MigrationContract, &migration_contract);
        env.storage()
            .persistent()
            .set(&DataKey::VirtualXlm, &virtual_xlm);
        env.storage()
            .persistent()
            .set(&DataKey::VirtualTokens, &virtual_tokens);
    }

    pub fn buy(
        env: Env,
        buyer: Address,
        launch_id: u64,
        token_address: Address,
        xlm_token: Address,
        xlm_amount: i128,
        min_tokens: i128,
        target_market_cap: i128,
        total_supply: i128,
    ) -> i128 {
        buyer.require_auth();

        let tokens_out = Self::get_buy_quote(env.clone(), launch_id, xlm_amount);
        if tokens_out < min_tokens {
            panic!("slippage: tokens out below minimum");
        }

        let xlm_client = token::Client::new(&env, &xlm_token);
        xlm_client.transfer(&buyer, &env.current_contract_address(), &xlm_amount);

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &buyer, &tokens_out);

        let mut state = Self::get_state(&env, launch_id);
        state.raised_xlm += xlm_amount;
        state.sold_tokens += tokens_out;
        Self::set_state(&env, launch_id, &state);

        let launch_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::LaunchContract)
            .expect("not initialized");

        // update_progress(launch_id, raised_xlm, sold_tokens)
        env.invoke_contract::<()>(
            &launch_addr,
            &Symbol::new(&env, "update_progress"),
            soroban_sdk::vec![
                &env,
                launch_id.into_val(&env),
                state.raised_xlm.into_val(&env),
                state.sold_tokens.into_val(&env),
            ],
        );

        // Trigger migration if target reached
        if state.raised_xlm >= target_market_cap {
            let migration_addr: Address = env
                .storage()
                .persistent()
                .get(&DataKey::MigrationContract)
                .expect("not initialized");
            let remaining = total_supply - state.sold_tokens;
            env.invoke_contract::<()>(
                &migration_addr,
                &Symbol::new(&env, "migrate"),
                soroban_sdk::vec![
                    &env,
                    launch_id.into_val(&env),
                    token_address.into_val(&env),
                    state.raised_xlm.into_val(&env),
                    remaining.into_val(&env),
                ],
            );
        }

        env.events().publish(
            (symbol_short!("buy"), buyer),
            (launch_id, xlm_amount, tokens_out),
        );

        tokens_out
    }

    pub fn sell(
        env: Env,
        seller: Address,
        launch_id: u64,
        token_address: Address,
        xlm_token: Address,
        token_amount: i128,
        min_xlm: i128,
    ) -> i128 {
        seller.require_auth();

        let xlm_out = Self::get_sell_quote(env.clone(), launch_id, token_amount);
        if xlm_out < min_xlm {
            panic!("slippage: xlm out below minimum");
        }

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&seller, &env.current_contract_address(), &token_amount);

        let xlm_client = token::Client::new(&env, &xlm_token);
        xlm_client.transfer(&env.current_contract_address(), &seller, &xlm_out);

        let mut state = Self::get_state(&env, launch_id);
        state.raised_xlm -= xlm_out;
        state.sold_tokens -= token_amount;
        Self::set_state(&env, launch_id, &state);

        let launch_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::LaunchContract)
            .expect("not initialized");

        env.invoke_contract::<()>(
            &launch_addr,
            &Symbol::new(&env, "update_progress"),
            soroban_sdk::vec![
                &env,
                launch_id.into_val(&env),
                state.raised_xlm.into_val(&env),
                state.sold_tokens.into_val(&env),
            ],
        );

        env.events().publish(
            (symbol_short!("sell"), seller),
            (launch_id, token_amount, xlm_out),
        );

        xlm_out
    }

    pub fn get_price(env: Env, launch_id: u64) -> i128 {
        let state = Self::get_state(&env, launch_id);
        let (v_xlm, v_tokens) = Self::virtuals(&env);
        (v_xlm + state.raised_xlm) * 10_000_000 / (v_tokens + state.sold_tokens)
    }

    pub fn get_buy_quote(env: Env, launch_id: u64, xlm_amount: i128) -> i128 {
        let state = Self::get_state(&env, launch_id);
        let (v_xlm, v_tokens) = Self::virtuals(&env);
        xlm_amount * (v_tokens + state.sold_tokens) / (v_xlm + state.raised_xlm)
    }

    pub fn get_sell_quote(env: Env, launch_id: u64, token_amount: i128) -> i128 {
        let state = Self::get_state(&env, launch_id);
        let (v_xlm, v_tokens) = Self::virtuals(&env);
        token_amount * (v_xlm + state.raised_xlm) / (v_tokens + state.sold_tokens)
    }

    fn virtuals(env: &Env) -> (i128, i128) {
        let v_xlm: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::VirtualXlm)
            .unwrap_or(10_000_000_000);
        let v_tokens: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::VirtualTokens)
            .unwrap_or(1_000_000_000_000);
        (v_xlm, v_tokens)
    }

    fn get_state(env: &Env, launch_id: u64) -> CurveState {
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Curve(launch_id), TTL_THRESHOLD, TTL_BUMP);
        env.storage()
            .persistent()
            .get(&DataKey::Curve(launch_id))
            .unwrap_or(CurveState {
                raised_xlm: 0,
                sold_tokens: 0,
            })
    }

    fn set_state(env: &Env, launch_id: u64, state: &CurveState) {
        env.storage()
            .persistent()
            .set(&DataKey::Curve(launch_id), state);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Curve(launch_id), TTL_THRESHOLD, TTL_BUMP);
    }
}
