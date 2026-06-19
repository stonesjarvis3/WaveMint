#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Address, Vec, Map, token};

#[derive(Clone)]
#[contracttype]
pub struct RewardClaim {
    pub learner: Address,
    pub amount: i128,
    pub reason: Symbol,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct StreakBonus {
    pub streak_length: u32,
    pub bonus_percentage: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Milestone {
    pub milestone_id: u32,
    pub xp_required: u128,
    pub reward_amount: i128,
    pub title: Symbol,
}

pub const BASE_XP_TO_XLM_RATIO: u128 = 1; // 1 XP = 1 stroops (0.0000001 XLM)
pub const REFERRAL_BONUS_PERCENTAGE: u32 = 10; // 10% of referred user's rewards

#[contract]
pub struct RewardsContract;

#[contractimpl]
impl RewardsContract {
    /// Initialize rewards system with XLM token address
    pub fn initialize(env: Env, xlm_token: Address) -> bool {
        if env.storage().instance().has(&Symbol::new(&env, "xlm_token")) {
            return false;
        }
        
        env.storage().instance().set(&Symbol::new(&env, "xlm_token"), &xlm_token);
        
        // Initialize streak bonuses
        let mut bonuses: Vec<StreakBonus> = Vec::new(&env);
        bonuses.push_back(StreakBonus { streak_length: 7, bonus_percentage: 5 });
        bonuses.push_back(StreakBonus { streak_length: 14, bonus_percentage: 10 });
        bonuses.push_back(StreakBonus { streak_length: 30, bonus_percentage: 20 });
        bonuses.push_back(StreakBonus { streak_length: 60, bonus_percentage: 35 });
        bonuses.push_back(StreakBonus { streak_length: 100, bonus_percentage: 50 });
        
        env.storage().instance().set(&Symbol::new(&env, "streak_bonuses"), &bonuses);
        
        // Initialize milestones
        let mut milestones: Vec<Milestone> = Vec::new(&env);
        milestones.push_back(Milestone {
            milestone_id: 1,
            xp_required: 100,
            reward_amount: 1_000_000, // 0.1 XLM
            title: Symbol::new(&env, "bronze"),
        });
        milestones.push_back(Milestone {
            milestone_id: 2,
            xp_required: 500,
            reward_amount: 5_000_000, // 0.5 XLM
            title: Symbol::new(&env, "silver"),
        });
        milestones.push_back(Milestone {
            milestone_id: 3,
            xp_required: 1000,
            reward_amount: 10_000_000, // 1 XLM
            title: Symbol::new(&env, "gold"),
        });
        milestones.push_back(Milestone {
            milestone_id: 4,
            xp_required: 5000,
            reward_amount: 50_000_000, // 5 XLM
            title: Symbol::new(&env, "platinum"),
        });
        
        env.storage().instance().set(&Symbol::new(&env, "milestones"), &milestones);
        env.storage().instance().set(&Symbol::new(&env, "total_distributed"), &0i128);
        
        true
    }
    
    /// Calculate XLM reward from XP
    pub fn calculate_xlm_reward(env: Env, xp: u128) -> i128 {
        let ratio = BASE_XP_TO_XLM_RATIO as i128;
        (xp as i128) * ratio
    }
    
    /// Apply streak bonus to reward
    pub fn apply_streak_bonus(env: Env, base_reward: i128, streak: u32) -> i128 {
        let bonuses: Vec<StreakBonus> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "streak_bonuses"))
            .unwrap_or(Vec::new(&env));
        
        let mut bonus_percentage = 0u32;
        
        for bonus in bonuses.iter() {
            if streak >= bonus.streak_length {
                bonus_percentage = bonus.bonus_percentage;
            }
        }
        
        if bonus_percentage > 0 {
            base_reward + (base_reward * (bonus_percentage as i128) / 100)
        } else {
            base_reward
        }
    }
    
    /// Check and award milestone rewards
    pub fn check_milestone_reward(env: Env, learner: Address, total_xp: u128) -> Option<i128> {
        let milestones: Vec<Milestone> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "milestones"))
            .unwrap_or(Vec::new(&env));
        
        let mut reward = None;
        let claimed_key = Symbol::new(&env, "milestone_claimed");
        let mut claimed_milestones: Map<Address, Vec<u32>> = env.storage()
            .instance()
            .get(&claimed_key)
            .unwrap_or(Map::new(&env));
        
        let mut user_claimed = claimed_milestones.get(learner.clone()).unwrap_or(Vec::new(&env));
        
        for milestone in milestones.iter() {
            if total_xp >= milestone.xp_required {
                // Check if already claimed
                let mut already_claimed = false;
                for claimed_id in user_claimed.iter() {
                    if claimed_id == milestone.milestone_id {
                        already_claimed = true;
                        break;
                    }
                }
                
                if !already_claimed {
                    user_claimed.push_back(milestone.milestone_id);
                    reward = Some(milestone.reward_amount);
                }
            }
        }
        
        if reward.is_some() {
            claimed_milestones.set(learner, user_claimed);
            env.storage().instance().set(&claimed_key, &claimed_milestones);
        }
        
        reward
    }
    
    /// Distribute XLM reward to learner
    pub fn distribute_reward(
        env: Env,
        xlm_token: Address,
        learner: Address,
        amount: i128,
        reason: Symbol,
    ) -> bool {
        if amount <= 0 {
            return false;
        }
        
        let token_client = token::Client::new(&env, &xlm_token);
        
        // Transfer XLM to learner
        match token_client.try_transfer(&env.current_contract_address(), &learner, &amount) {
            Ok(_) => {
                // Log reward claim
                let mut claims: Vec<RewardClaim> = env.storage()
                    .instance()
                    .get(&Symbol::new(&env, "claims"))
                    .unwrap_or(Vec::new(&env));
                
                claims.push_back(RewardClaim {
                    learner,
                    amount,
                    reason,
                    timestamp: env.ledger().timestamp(),
                });
                
                env.storage().instance().set(&Symbol::new(&env, "claims"), &claims);
                
                // Update total distributed
                let total: i128 = env.storage()
                    .instance()
                    .get(&Symbol::new(&env, "total_distributed"))
                    .unwrap_or(0);
                env.storage().instance().set(&Symbol::new(&env, "total_distributed"), &(total + amount));
                
                true
            }
            Err(_) => false,
        }
    }
    
    /// Record referral relationship
    pub fn record_referral(env: Env, referrer: Address, referred: Address) -> bool {
        let mut referrals: Map<Address, Vec<Address>> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "referrals"))
            .unwrap_or(Map::new(&env));
        
        let mut user_referrals = referrals.get(referrer.clone()).unwrap_or(Vec::new(&env));
        user_referrals.push_back(referred);
        referrals.set(referrer, user_referrals);
        
        env.storage().instance().set(&Symbol::new(&env, "referrals"), &referrals);
        true
    }
    
    /// Distribute referral bonus
    pub fn distribute_referral_bonus(
        env: Env,
        xlm_token: Address,
        referrer: Address,
        referred_earnings: i128,
    ) -> bool {
        let bonus = (referred_earnings * (REFERRAL_BONUS_PERCENTAGE as i128)) / 100;
        Self::distribute_reward(env, xlm_token, referrer, bonus, Symbol::new(&env, "referral_bonus"))
    }
    
    /// Get total rewards distributed
    pub fn get_total_distributed(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "total_distributed"))
            .unwrap_or(0)
    }
    
    /// Get learner's total rewards claimed
    pub fn get_learner_total_rewards(env: Env, learner: Address) -> i128 {
        let claims: Vec<RewardClaim> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "claims"))
            .unwrap_or(Vec::new(&env));
        
        let mut total = 0i128;
        for claim in claims.iter() {
            if claim.learner == learner {
                total += claim.amount;
            }
        }
        total
    }
    
    /// Get all referrals for a user
    pub fn get_referrals(env: Env, user: Address) -> Vec<Address> {
        let referrals: Map<Address, Vec<Address>> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "referrals"))
            .unwrap_or(Map::new(&env));
        
        referrals.get(user).unwrap_or(Vec::new(&env))
    }
}
