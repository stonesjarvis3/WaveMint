#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Address, Vec, Map, String};

#[derive(Clone)]
#[contracttype]
pub struct Learner {
    pub address: Address,
    pub total_xp: u128,
    pub current_streak: u32,
    pub longest_streak: u32,
    pub last_activity_timestamp: u64,
    pub courses_completed: u32,
    pub skills_unlocked: Vec<String>,
}

#[derive(Clone)]
#[contracttype]
pub struct Course {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub xp_reward: u128,
    pub difficulty_level: u32,
    pub creator: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct CourseProgress {
    pub learner: Address,
    pub course_id: u32,
    pub completion_percentage: u32,
    pub lessons_completed: u32,
    pub xp_earned: u128,
    pub completed: bool,
}

pub const ONE_DAY_IN_SECONDS: u64 = 86400;

#[contract]
pub struct LearningContract;

#[contractimpl]
impl LearningContract {
    /// Initialize a new learner in the system
    pub fn register_learner(env: Env, learner: Address) -> bool {
        learner.require_auth();
        
        let key = Symbol::new(&env, "learner");
        
        if env.storage().instance().has(&key) {
            return false;
        }
        
        let new_learner = Learner {
            address: learner.clone(),
            total_xp: 0,
            current_streak: 0,
            longest_streak: 0,
            last_activity_timestamp: env.ledger().timestamp(),
            courses_completed: 0,
            skills_unlocked: Vec::new(&env),
        };
        
        let mut learners: Map<Address, Learner> = if env.storage().instance().has(&Symbol::new(&env, "learners")) {
            env.storage().instance().get(&Symbol::new(&env, "learners")).unwrap()
        } else {
            Map::new(&env)
        };
        
        learners.set(learner, new_learner);
        env.storage().instance().set(&Symbol::new(&env, "learners"), &learners);
        
        true
    }
    
    /// Create a new course
    pub fn create_course(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        xp_reward: u128,
        difficulty_level: u32,
    ) -> u32 {
        creator.require_auth();
        
        let course_id: u32 = env.storage()
            .instance()
            .get::<_, u32>(&Symbol::new(&env, "next_course_id"))
            .unwrap_or(1);
        
        let course = Course {
            id: course_id,
            title,
            description,
            xp_reward,
            difficulty_level,
            creator,
        };
        
        let mut courses: Map<u32, Course> = if env.storage().instance().has(&Symbol::new(&env, "courses")) {
            env.storage().instance().get(&Symbol::new(&env, "courses")).unwrap()
        } else {
            Map::new(&env)
        };
        
        courses.set(course_id, course);
        env.storage().instance().set(&Symbol::new(&env, "courses"), &courses);
        env.storage().instance().set(&Symbol::new(&env, "next_course_id"), &(course_id + 1));
        
        course_id
    }
    
    /// Enroll a learner in a course
    pub fn enroll_in_course(env: Env, learner: Address, course_id: u32) -> bool {
        learner.require_auth();
        
        let progress = CourseProgress {
            learner: learner.clone(),
            course_id,
            completion_percentage: 0,
            lessons_completed: 0,
            xp_earned: 0,
            completed: false,
        };
        
        let key = Symbol::new(&env, "progress");
        let mut progress_map: Map<(Address, u32), CourseProgress> = 
            if env.storage().instance().has(&key) {
                env.storage().instance().get(&key).unwrap()
            } else {
                Map::new(&env)
            };
        
        progress_map.set((learner, course_id), progress);
        env.storage().instance().set(&key, &progress_map);
        
        true
    }
    
    /// Update course progress
    pub fn update_progress(
        env: Env,
        learner: Address,
        course_id: u32,
        lessons_completed: u32,
        completion_percentage: u32,
    ) -> bool {
        learner.require_auth();
        
        let key = Symbol::new(&env, "progress");
        let mut progress_map: Map<(Address, u32), CourseProgress> = 
            if env.storage().instance().has(&key) {
                env.storage().instance().get(&key).unwrap()
            } else {
                return false;
            };
        
        if let Some(mut progress) = progress_map.get((learner.clone(), course_id)) {
            progress.lessons_completed = lessons_completed;
            progress.completion_percentage = completion_percentage;
            
            if completion_percentage >= 100 {
                progress.completed = true;
                Self::complete_course(env.clone(), learner.clone(), course_id);
            }
            
            progress_map.set((learner, course_id), progress);
            env.storage().instance().set(&key, &progress_map);
            true
        } else {
            false
        }
    }
    
    /// Complete a course and award XP
    fn complete_course(env: Env, learner: Address, course_id: u32) -> bool {
        let courses_key = Symbol::new(&env, "courses");
        let courses: Map<u32, Course> = env.storage()
            .instance()
            .get(&courses_key)
            .unwrap();
        
        if let Some(course) = courses.get(course_id) {
            Self::add_xp_to_learner(env.clone(), learner.clone(), course.xp_reward);
            
            let mut learners: Map<Address, Learner> = env.storage()
                .instance()
                .get(&Symbol::new(&env, "learners"))
                .unwrap();
            
            if let Some(mut l) = learners.get(learner.clone()) {
                l.courses_completed += 1;
                learners.set(learner, l);
                env.storage().instance().set(&Symbol::new(&env, "learners"), &learners);
            }
            
            true
        } else {
            false
        }
    }
    
    /// Add XP to a learner
    pub fn add_xp_to_learner(env: Env, learner: Address, xp: u128) -> bool {
        let mut learners: Map<Address, Learner> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "learners"))
            .unwrap_or(Map::new(&env));
        
        if let Some(mut l) = learners.get(learner.clone()) {
            l.total_xp += xp;
            learners.set(learner, l);
            env.storage().instance().set(&Symbol::new(&env, "learners"), &learners);
            true
        } else {
            false
        }
    }
    
    /// Update learning streak
    pub fn update_streak(env: Env, learner: Address) -> u32 {
        let current_time = env.ledger().timestamp();
        let mut learners: Map<Address, Learner> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "learners"))
            .unwrap_or(Map::new(&env));
        
        if let Some(mut l) = learners.get(learner.clone()) {
            let time_diff = current_time - l.last_activity_timestamp;
            
            if time_diff <= ONE_DAY_IN_SECONDS {
                l.current_streak += 1;
            } else if time_diff > 2 * ONE_DAY_IN_SECONDS {
                l.current_streak = 1;
            }
            
            if l.current_streak > l.longest_streak {
                l.longest_streak = l.current_streak;
            }
            
            l.last_activity_timestamp = current_time;
            learners.set(learner, l.clone());
            env.storage().instance().set(&Symbol::new(&env, "learners"), &learners);
            
            l.current_streak
        } else {
            0
        }
    }
    
    /// Unlock a skill for a learner
    pub fn unlock_skill(env: Env, learner: Address, skill: String) -> bool {
        let mut learners: Map<Address, Learner> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "learners"))
            .unwrap_or(Map::new(&env));
        
        if let Some(mut l) = learners.get(learner.clone()) {
            let mut skills = l.skills_unlocked;
            // Check if skill already unlocked
            for existing_skill in skills.iter() {
                if existing_skill == skill {
                    return false;
                }
            }
            skills.push_back(skill);
            l.skills_unlocked = skills;
            learners.set(learner, l);
            env.storage().instance().set(&Symbol::new(&env, "learners"), &learners);
            true
        } else {
            false
        }
    }
    
    /// Get learner profile
    pub fn get_learner(env: Env, learner: Address) -> Option<Learner> {
        let learners: Map<Address, Learner> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "learners"))
            .unwrap_or(Map::new(&env));
        
        learners.get(learner)
    }
    
    /// Get course by ID
    pub fn get_course(env: Env, course_id: u32) -> Option<Course> {
        let courses: Map<u32, Course> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "courses"))
            .unwrap_or(Map::new(&env));
        
        courses.get(course_id)
    }
    
    /// Get course progress
    pub fn get_progress(env: Env, learner: Address, course_id: u32) -> Option<CourseProgress> {
        let progress_map: Map<(Address, u32), CourseProgress> = env.storage()
            .instance()
            .get(&Symbol::new(&env, "progress"))
            .unwrap_or(Map::new(&env));
        
        progress_map.get((learner, course_id))
    }
}
