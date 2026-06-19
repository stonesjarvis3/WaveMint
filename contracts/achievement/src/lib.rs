#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Address, Vec, Map, String};

#[derive(Clone)]
#[contracttype]
pub struct Badge {
    pub badge_id: u32,
    pub name: String,
    pub description: String,
    pub image_url: String,
    pub criteria: String,
    pub rarity: Symbol, // common, uncommon, rare, epic, legendary
}

#[derive(Clone)]
#[contracttype]
pub struct Achievement {
    pub achievement_id: u32,
    pub learner: Address,
    pub badge_id: u32,
    pub earned_at: u64,
    pub verified: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct Certificate {
    pub certificate_id: u32,
    pub learner: Address,
    pub course_title: String,
    pub completion_date: u64,
    pub issuer: Address,
    pub metadata_uri: String,
}

#[contract]
pub struct AchievementContract;

#[contractimpl]
impl AchievementContract {
    /// Initialize achievement system
    pub fn initialize(env: Env) -> bool {
        if env.storage().instance().has(&Symbol::new(&env, "initialized")) {
            return false;
        }
        
        env.storage().instance().set(&Symbol::new(&env, "initialized"), &true);
        env.storage().instance().set(&Symbol::new(&env, "next_badge_id"), &1u32);
        env.storage().instance().set(&Symbol::new(&env, "next_certificate_id"), &1u32);
        
        // Create initial badges
        let mut badges: Vec<Badge> = Vec::new(&env);
        
        // First Timer
        badges.push_back(Badge {
            badge_id: 1,
            name: String::from_str(&env, "First Step"),
            description: String::from_str(&env, "Complete your first course"),
            image_url: String::from_str(&env, "ipfs://QmFirstStep"),
            criteria: String::from_str(&env, "complete_course:1"),
            rarity: Symbol::new(&env, "common"),
        });
        
        // Streak Master
        badges.push_back(Badge {
            badge_id: 2,
            name: String::from_str(&env, "Streak Master"),
            description: String::from_str(&env, "Maintain a 30-day learning streak"),
            image_url: String::from_str(&env, "ipfs://QmStreakMaster"),
            criteria: String::from_str(&env, "streak:30"),
            rarity: Symbol::new(&env, "rare"),
        });
        
        // Course Master
        badges.push_back(Badge {
            badge_id: 3,
            name: String::from_str(&env, "Course Master"),
            description: String::from_str(&env, "Complete 10 courses"),
            image_url: String::from_str(&env, "ipfs://QmCourseMaster"),
            criteria: String::from_str(&env, "courses_completed:10"),
            rarity: Symbol::new(&env, "epic"),
        });
        
        // Knowledge Seeker
        badges.push_back(Badge {
            badge_id: 4,
            name: String::from_str(&env, "Knowledge Seeker"),
            description: String::from_str(&env, "Earn 1000 XP"),
            image_url: String::from_str(&env, "ipfs://QmKnowledgeSeeker"),
            criteria: String::from_str(&env, "xp:1000"),
            rarity: Symbol::new(&env, "uncommon"),
        });
        
        // Legend
        badges.push_back(Badge {
            badge_id: 5,
            name: String::from_str(&env, "Legend"),
            description: String::from_str(&env, "Reach Expert level (5000+ XP)"),
            image_url: String::from_str(&env, "ipfs://QmLegend"),
            criteria: String::from_str(&env, "xp:5000"),
            rarity: Symbol::new(&env, "legendary"),
        });
        
        env.storage().instance().set(&Symbol::new(&env, "badges"), &badges);
        
        true
    }
    
    /// Award a badge to a learner
    pub fn award_badge(env: Env, learner: Address, badge_id: u32) -> u32 {
        let achievement_id: u32 = env.storage()
            .instance()
            .get(&Symbol::new(&env, "next_achievement_id"))
            .unwrap_or(1);
        
        let achievement = Achievement {
            achievement_id,
            learner,
            badge_id,
            earned_at: env.ledger().timestamp(),
            verified: false,
        };
        
        let mut achievements: Vec<Achievement> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "achievements"))
            .unwrap_or(Vec::new(&env));
        
        achievements.push_back(achievement);
        env.storage().instance().set(&Symbol::new(&env, "achievements"), &achievements);
        env.storage().instance().set(&Symbol::new(&env, "next_achievement_id"), &(achievement_id + 1));
        
        achievement_id
    }
    
    /// Verify an achievement (for minting as NFT)
    pub fn verify_achievement(env: Env, achievement_id: u32) -> bool {
        let mut achievements: Vec<Achievement> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "achievements"))
            .unwrap_or(Vec::new(&env));
        
        let mut found = false;
        let mut updated = Vec::new(&env);
        
        for mut achievement in achievements.iter() {
            if achievement.achievement_id == achievement_id {
                achievement.verified = true;
                found = true;
            }
            updated.push_back(achievement);
        }
        
        if found {
            env.storage().instance().set(&Symbol::new(&env, "achievements"), &updated);
        }
        
        found
    }
    
    /// Issue a certificate for course completion
    pub fn issue_certificate(
        env: Env,
        learner: Address,
        course_title: String,
        issuer: Address,
        metadata_uri: String,
    ) -> u32 {
        let certificate_id: u32 = env.storage()
            .instance()
            .get(&Symbol::new(&env, "next_certificate_id"))
            .unwrap_or(1);
        
        let certificate = Certificate {
            certificate_id,
            learner: learner.clone(),
            course_title,
            completion_date: env.ledger().timestamp(),
            issuer,
            metadata_uri,
        };
        
        let mut certificates: Vec<Certificate> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "certificates"))
            .unwrap_or(Vec::new(&env));
        
        certificates.push_back(certificate);
        env.storage().instance().set(&Symbol::new(&env, "certificates"), &certificates);
        env.storage().instance().set(&Symbol::new(&env, "next_certificate_id"), &(certificate_id + 1));
        
        // Award "Certificate Holder" badge if first certificate
        let mut user_certs: Vec<u32> = env.storage()
            .instance()
            .get(&(Symbol::new(&env, "user_certificates"), learner.clone()).0)
            .unwrap_or(Vec::new(&env));
        
        if user_certs.len() == 0 {
            Self::award_badge(env, learner, 6); // Badge ID 6 for first certificate
        }
        
        user_certs.push_back(certificate_id);
        env.storage().instance().set(
            &(Symbol::new(&env, "user_certificates"), learner).0,
            &user_certs
        );
        
        certificate_id
    }
    
    /// Get all achievements for a learner
    pub fn get_learner_achievements(env: Env, learner: Address) -> Vec<Achievement> {
        let achievements: Vec<Achievement> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "achievements"))
            .unwrap_or(Vec::new(&env));
        
        let mut user_achievements = Vec::new(&env);
        for achievement in achievements.iter() {
            if achievement.learner == learner {
                user_achievements.push_back(achievement);
            }
        }
        
        user_achievements
    }
    
    /// Get all certificates for a learner
    pub fn get_learner_certificates(env: Env, learner: Address) -> Vec<Certificate> {
        let certificates: Vec<Certificate> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "certificates"))
            .unwrap_or(Vec::new(&env));
        
        let mut user_certificates = Vec::new(&env);
        for certificate in certificates.iter() {
            if certificate.learner == learner {
                user_certificates.push_back(certificate);
            }
        }
        
        user_certificates
    }
    
    /// Get badge details
    pub fn get_badge(env: Env, badge_id: u32) -> Option<Badge> {
        let badges: Vec<Badge> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "badges"))
            .unwrap_or(Vec::new(&env));
        
        for badge in badges.iter() {
            if badge.badge_id == badge_id {
                return Some(badge);
            }
        }
        
        None
    }
    
    /// Get all badges
    pub fn get_all_badges(env: Env) -> Vec<Badge> {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "badges"))
            .unwrap_or(Vec::new(&env))
    }
}
