#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Address, Vec, Map};

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
#[contracttype]
pub struct LeaderboardEntry {
    pub rank: u32,
    pub learner: Address,
    pub total_xp: u128,
    pub courses_completed: u32,
    pub longest_streak: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct CompetitionReward {
    pub rank: u32,
    pub reward_amount: i128,
}

pub const WEEK_IN_SECONDS: u64 = 604_800;
pub const MONTH_IN_SECONDS: u64 = 2_592_000;

#[contract]
pub struct LeaderboardContract;

#[contractimpl]
impl LeaderboardContract {
    /// Initialize leaderboard system
    pub fn initialize(env: Env) -> bool {
        if env.storage().instance().has(&Symbol::new(&env, "initialized")) {
            return false;
        }
        
        env.storage().instance().set(&Symbol::new(&env, "initialized"), &true);
        
        // Set up competition rewards
        let mut rewards: Vec<CompetitionReward> = Vec::new(&env);
        rewards.push_back(CompetitionReward { rank: 1, reward_amount: 50_000_000 }); // 5 XLM
        rewards.push_back(CompetitionReward { rank: 2, reward_amount: 30_000_000 }); // 3 XLM
        rewards.push_back(CompetitionReward { rank: 3, reward_amount: 20_000_000 }); // 2 XLM
        rewards.push_back(CompetitionReward { rank: 4, reward_amount: 10_000_000 }); // 1 XLM
        rewards.push_back(CompetitionReward { rank: 5, reward_amount: 5_000_000 });  // 0.5 XLM
        
        env.storage().instance().set(&Symbol::new(&env, "competition_rewards"), &rewards);
        
        true
    }
    
    /// Update learner's XP in leaderboard
    pub fn update_leaderboard_xp(env: Env, learner: Address, xp: u128) -> u32 {
        let mut entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        let mut found = false;
        let mut updated_entries = Vec::new(&env);
        
        for mut entry in entries.iter() {
            if entry.learner == learner {
                entry.total_xp = xp;
                found = true;
            }
            updated_entries.push_back(entry);
        }
        
        if !found {
            updated_entries.push_back(LeaderboardEntry {
                rank: 0,
                learner: learner.clone(),
                total_xp: xp,
                courses_completed: 0,
                longest_streak: 0,
            });
        }
        
        // Resort and update ranks
        Self::resort_leaderboard(env.clone(), updated_entries);
        
        Self::get_learner_rank(env, learner).unwrap_or(0)
    }
    
    /// Update learner's courses completed
    pub fn update_courses_completed(env: Env, learner: Address, count: u32) -> bool {
        let mut entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        let mut found = false;
        let mut updated_entries = Vec::new(&env);
        
        for mut entry in entries.iter() {
            if entry.learner == learner {
                entry.courses_completed = count;
                found = true;
            }
            updated_entries.push_back(entry);
        }
        
        if found {
            env.storage().instance().set(&Symbol::new(&env, "leaderboard"), &updated_entries);
        }
        
        found
    }
    
    /// Update learner's longest streak
    pub fn update_longest_streak(env: Env, learner: Address, streak: u32) -> bool {
        let mut entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        let mut found = false;
        let mut updated_entries = Vec::new(&env);
        
        for mut entry in entries.iter() {
            if entry.learner == learner {
                entry.longest_streak = streak;
                found = true;
            }
            updated_entries.push_back(entry);
        }
        
        if found {
            env.storage().instance().set(&Symbol::new(&env, "leaderboard"), &updated_entries);
        }
        
        found
    }
    
    /// Resort leaderboard by XP (descending)
    fn resort_leaderboard(env: Env, mut entries: Vec<LeaderboardEntry>) {
        // Simple bubble sort (in production, consider more efficient sorting)
        let len = entries.len();
        
        for i in 0..len {
            for j in 0..(len - 1 - i) {
                if entries.get(j as u32).unwrap().total_xp < 
                   entries.get((j + 1) as u32).unwrap().total_xp {
                    let temp = entries.get(j as u32).unwrap();
                    let next = entries.get((j + 1) as u32).unwrap();
                    
                    // Swap entries
                    let mut updated = Vec::new(&env);
                    for k in 0..len {
                        if k == j {
                            updated.push_back(next);
                        } else if k == j + 1 {
                            updated.push_back(temp);
                        } else {
                            updated.push_back(entries.get(k as u32).unwrap());
                        }
                    }
                    entries = updated;
                }
            }
        }
        
        // Update ranks
        let mut final_entries = Vec::new(&env);
        for (rank, entry) in entries.iter().enumerate() {
            let mut updated_entry = entry;
            updated_entry.rank = (rank + 1) as u32;
            final_entries.push_back(updated_entry);
        }
        
        env.storage().instance().set(&Symbol::new(&env, "leaderboard"), &final_entries);
    }
    
    /// Get top N learners
    pub fn get_top_learners(env: Env, limit: u32) -> Vec<LeaderboardEntry> {
        let entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        let mut top = Vec::new(&env);
        let max_count = if entries.len() < (limit as usize) {
            entries.len()
        } else {
            limit as usize
        };
        
        for i in 0..max_count {
            top.push_back(entries.get(i as u32).unwrap());
        }
        
        top
    }
    
    /// Get learner's rank
    pub fn get_learner_rank(env: Env, learner: Address) -> Option<u32> {
        let entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        for entry in entries.iter() {
            if entry.learner == learner {
                return Some(entry.rank);
            }
        }
        
        None
    }
    
    /// Get learner's stats
    pub fn get_learner_stats(env: Env, learner: Address) -> Option<LeaderboardEntry> {
        let entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        for entry in entries.iter() {
            if entry.learner == learner {
                return Some(entry);
            }
        }
        
        None
    }
    
    /// Record weekly competition winner
    pub fn record_weekly_winner(env: Env, winner: Address, xp: u128) -> bool {
        let week_key = Symbol::new(&env, "weekly_winner");
        let current_week = env.ledger().timestamp() / WEEK_IN_SECONDS;
        
        let mut weekly_winners: Map<u64, Address> = env.storage()
            .instance()
            .get(&week_key)
            .unwrap_or(Map::new(&env));
        
        if !weekly_winners.has(&current_week) {
            weekly_winners.set(current_week, winner.clone());
            env.storage().instance().set(&week_key, &weekly_winners);
            
            // Record the winning XP
            let mut weekly_xp: Map<u64, u128> = env.storage()
                .instance()
                .get(&Symbol::new(&env, "weekly_xp"))
                .unwrap_or(Map::new(&env));
            weekly_xp.set(current_week, xp);
            env.storage().instance().set(&Symbol::new(&env, "weekly_xp"), &weekly_xp);
            
            true
        } else {
            false
        }
    }
    
    /// Record monthly competition winner
    pub fn record_monthly_winner(env: Env, winner: Address, xp: u128) -> bool {
        let month_key = Symbol::new(&env, "monthly_winner");
        let current_month = env.ledger().timestamp() / MONTH_IN_SECONDS;
        
        let mut monthly_winners: Map<u64, Address> = env.storage()
            .instance()
            .get(&month_key)
            .unwrap_or(Map::new(&env));
        
        if !monthly_winners.has(&current_month) {
            monthly_winners.set(current_month, winner.clone());
            env.storage().instance().set(&month_key, &monthly_winners);
            
            // Record the winning XP
            let mut monthly_xp: Map<u64, u128> = env.storage()
                .instance()
                .get(&Symbol::new(&env, "monthly_xp"))
                .unwrap_or(Map::new(&env));
            monthly_xp.set(current_month, xp);
            env.storage().instance().set(&Symbol::new(&env, "monthly_xp"), &monthly_xp);
            
            true
        } else {
            false
        }
    }
    
    /// Get competition rewards for top finishers
    pub fn get_competition_rewards(env: Env) -> Vec<CompetitionReward> {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "competition_rewards"))
            .unwrap_or(Vec::new(&env))
    }
    
    /// Get total learners
    pub fn get_total_learners(env: Env) -> u32 {
        let entries: Vec<LeaderboardEntry> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "leaderboard"))
            .unwrap_or(Vec::new(&env));
        
        entries.len() as u32
    }
}
