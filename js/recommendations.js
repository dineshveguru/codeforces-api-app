/**
 * CodeFit - Recommendations Module
 * Advanced personalized learning path generator with ML integration
 */

const Recommendations = {
    // Learning paths with progressive skills
    LEARNING_PATHS: {
        beginner: [
            { level: 1, focus: ['implementation', 'math'], ratingRange: [800, 1000], count: 5 },
            { level: 2, focus: ['implementation', 'math', 'greedy'], ratingRange: [900, 1100], count: 5 },
            { level: 3, focus: ['implementation', 'math', 'greedy', 'brute force'], ratingRange: [1000, 1200], count: 5 },
            { level: 4, focus: ['implementation', 'math', 'greedy', 'brute force', 'data structures'], ratingRange: [1100, 1300], count: 5 },
            { level: 5, focus: ['implementation', 'math', 'greedy', 'brute force', 'data structures', 'dp'], ratingRange: [1200, 1400], count: 5 }
        ],
        intermediate: [
            { level: 1, focus: ['data structures', 'dp', 'greedy'], ratingRange: [1300, 1500], count: 5 },
            { level: 2, focus: ['data structures', 'dp', 'greedy', 'graphs'], ratingRange: [1400, 1600], count: 5 },
            { level: 3, focus: ['data structures', 'dp', 'greedy', 'graphs', 'binary search'], ratingRange: [1500, 1700], count: 5 },
            { level: 4, focus: ['data structures', 'dp', 'greedy', 'graphs', 'binary search', 'strings'], ratingRange: [1600, 1800], count: 5 },
            { level: 5, focus: ['data structures', 'dp', 'greedy', 'graphs', 'binary search', 'strings', 'number theory'], ratingRange: [1700, 1900], count: 5 }
        ],
        advanced: [
            { level: 1, focus: ['dp', 'graphs', 'trees'], ratingRange: [1800, 2000], count: 5 },
            { level: 2, focus: ['dp', 'graphs', 'trees', 'number theory'], ratingRange: [1900, 2100], count: 5 },
            { level: 3, focus: ['dp', 'graphs', 'trees', 'number theory', 'combinatorics'], ratingRange: [2000, 2200], count: 5 },
            { level: 4, focus: ['dp', 'graphs', 'trees', 'number theory', 'combinatorics', 'geometry'], ratingRange: [2100, 2300], count: 5 },
            { level: 5, focus: ['dp', 'graphs', 'trees', 'number theory', 'combinatorics', 'geometry', 'string suffix structures'], ratingRange: [2200, 2500], count: 5 }
        ]
    },
    
    // Topic roadmaps
    TOPIC_ROADMAPS: {
        'dynamic programming': [
            { name: 'Introduction to DP', difficulty: 'easy', problems: [] },
            { name: ' 1D DP', difficulty: 'easy', problems: [] },
            { name: '2D DP', difficulty: 'medium', problems: [] },
            { name: 'DP on Trees', difficulty: 'medium', problems: [] },
            { name: 'DP with Bitmasks', difficulty: 'hard', problems: [] },
            { name: 'Advanced DP Techniques', difficulty: 'hard', problems: [] }
        ],
        'graphs': [
            { name: 'Graph Representation', difficulty: 'easy', problems: [] },
            { name: 'DFS & BFS', difficulty: 'easy', problems: [] },
            { name: 'Shortest Paths', difficulty: 'medium', problems: [] },
            { name: 'Minimum Spanning Trees', difficulty: 'medium', problems: [] },
            { name: 'Advanced Graph Algorithms', difficulty: 'hard', problems: [] }
        ],
        'data structures': [
            { name: 'Arrays & Strings', difficulty: 'easy', problems: [] },
            { name: 'Stacks & Queues', difficulty: 'easy', problems: [] },
            { name: 'Trees & Heaps', difficulty: 'medium', problems: [] },
            { name: 'Disjoint Sets', difficulty: 'medium', problems: [] },
            { name: 'Advanced Data Structures', difficulty: 'hard', problems: [] }
        ]
    },
    
    /**
     * Generate a personalized learning path
     * @param {Object} userData - User data including submissions
     * @param {Object} problemsData - Problems data from API
     * @returns {Object} - Learning path with problems for each level
     */
    generateLearningPath: function(userData, problemsData) {
        if (!userData || !problemsData || !problemsData.problems) {
            return null;
        }
        
        // Get user's current rating
        const userRating = userData.userInfo.rating || 800;
        
        // Determine which path to use
        let path;
        if (userRating < 1300) {
            path = this.LEARNING_PATHS.beginner;
        } else if (userRating < 1800) {
            path = this.LEARNING_PATHS.intermediate;
        } else {
            path = this.LEARNING_PATHS.advanced;
        }
        
        // Get solved problems
        const solvedProblems = new Set();
        userData.submissions
            .filter(sub => sub.verdict === 'OK')
            .forEach(sub => {
                const problemId = `${sub.problem.contestId}${sub.problem.index}`;
                solvedProblems.add(problemId);
            });
        
        // Get attempted problems
        const attemptedProblems = new Set();
        userData.submissions.forEach(sub => {
            const problemId = `${sub.problem.contestId}${sub.problem.index}`;
            attemptedProblems.add(problemId);
        });
        
        // Generate a learning path with problems for each level
        const learningPath = path.map(level => {
            // Filter problems matching this level's criteria
            const matchingProblems = problemsData.problems.filter(problem => {
                // Check if problem is in the right rating range
                const isRightDifficulty = problem.rating && 
                    problem.rating >= level.ratingRange[0] && 
                    problem.rating <= level.ratingRange[1];
                
                // Check if problem has at least one of the focus tags
                const hasFocusTag = problem.tags && 
                    problem.tags.some(tag => level.focus.includes(tag));
                
                // Check if problem is not already solved or attempted
                const problemId = `${problem.contestId}${problem.index}`;
                const isNotAttempted = !attemptedProblems.has(problemId);
                
                return isRightDifficulty && hasFocusTag && isNotAttempted;
            });
            
            // Sort problems by rating
            matchingProblems.sort((a, b) => a.rating - b.rating);
            
            // Take the required number of problems
            const selectedProblems = matchingProblems.slice(0, level.count);
            
            return {
                level: level.level,
                focus: level.focus,
                ratingRange: level.ratingRange,
                problems: selectedProblems
            };
        });
        
        return {
            path: path === this.LEARNING_PATHS.beginner ? 'beginner' : 
                  path === this.LEARNING_PATHS.intermediate ? 'intermediate' : 'advanced',
            currentRating: userRating,
            levels: learningPath
        };
    },
    
    /**
     * Generate topic-specific roadmap
     * @param {string} topic - The topic to focus on
     * @param {Object} userData - User data including submissions
     * @param {Object} problemsData - Problems data from API
     * @returns {Object} - Roadmap with problems for each stage
     */
    generateTopicRoadmap: function(topic, userData, problemsData) {
        if (!this.TOPIC_ROADMAPS[topic] || !userData || !problemsData || !problemsData.problems) {
            return null;
        }
        
        // Get roadmap for this topic
        const roadmap = this.TOPIC_ROADMAPS[topic];
        
        // Get solved problems
        const solvedProblems = new Set();
        userData.submissions
            .filter(sub => sub.verdict === 'OK')
            .forEach(sub => {
                const problemId = `${sub.problem.contestId}${sub.problem.index}`;
                solvedProblems.add(problemId);
            });
        
        // Get attempted problems
        const attemptedProblems = new Set();
        userData.submissions.forEach(sub => {
            const problemId = `${sub.problem.contestId}${sub.problem.index}`;
            attemptedProblems.add(problemId);
        });
        
        // Fill each stage with appropriate problems
        const filledRoadmap = roadmap.map(stage => {
            // Get difficulty range
            const difficultyRange = this.getDifficultyRangeForStage(stage.difficulty, userData);
            
            // Filter problems matching this stage's criteria
            const matchingProblems = problemsData.problems.filter(problem => {
                // Check if problem is in the right rating range
                const isRightDifficulty = problem.rating && 
                    problem.rating >= difficultyRange[0] && 
                    problem.rating <= difficultyRange[1];
                
                // Check if problem has the topic tag
                const hasTopicTag = problem.tags && 
                    problem.tags.includes(topic);
                
                // Check if problem is not already solved or attempted
                const problemId = `${problem.contestId}${problem.index}`;
                const isNotAttempted = !attemptedProblems.has(problemId);
                
                return isRightDifficulty && hasTopicTag && isNotAttempted;
            });
            
            // Sort problems by rating
            matchingProblems.sort((a, b) => a.rating - b.rating);
            
            // Take up to 5 problems
            const selectedProblems = matchingProblems.slice(0, 5);
            
            return {
                name: stage.name,
                difficulty: stage.difficulty,
                difficultyRange: difficultyRange,
                problems: selectedProblems
            };
        });
        
        return {
            topic: topic,
            stages: filledRoadmap
        };
    },
    
    /**
     * Get difficulty range for a stage based on user rating
     * @param {string} stageDifficulty - Difficulty level (easy, medium, hard)
     * @param {Object} userData - User data
     * @returns {Array} - Min and max rating range
     */
    getDifficultyRangeForStage: function(stageDifficulty, userData) {
        const userRating = userData.userInfo.rating || 800;
        
        if (stageDifficulty === 'easy') {
            return [Math.max(800, userRating - 300), userRating];
        } else if (stageDifficulty === 'medium') {
            return [userRating, userRating + 200];
        } else { // hard
            return [userRating + 200, userRating + 400];
        }
    },
    
    /**
     * Track user progress and adjust recommendations
     * @param {Object} userData - User data including submissions
     * @param {Object} learningPath - Current learning path
     * @returns {Object} - Updated progress information
     */
    trackProgress: function(userData, learningPath) {
        if (!userData || !learningPath) {
            return null;
        }
        
        // Get solved problems
        const solvedProblems = new Set();
        userData.submissions
            .filter(sub => sub.verdict === 'OK')
            .forEach(sub => {
                const problemId = `${sub.problem.contestId}${sub.problem.index}`;
                solvedProblems.add(problemId);
            });
        
        // Calculate progress for each level
        const levelProgress = learningPath.levels.map(level => {
            const totalProblems = level.problems.length;
            
            if (totalProblems === 0) {
                return { level: level.level, completed: 0, total: 0, percentage: 0 };
            }
            
            // Count solved problems in this level
            const solvedCount = level.problems.filter(problem => {
                const problemId = `${problem.contestId}${problem.index}`;
                return solvedProblems.has(problemId);
            }).length;
            
            return {
                level: level.level,
                completed: solvedCount,
                total: totalProblems,
                percentage: Math.round((solvedCount / totalProblems) * 100)
            };
        });
        
        // Calculate overall progress
        const totalProblems = levelProgress.reduce((sum, level) => sum + level.total, 0);
        const totalSolved = levelProgress.reduce((sum, level) => sum + level.completed, 0);
        const overallPercentage = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
        
        // Determine if user should advance to next level or path
        const currentLevelIndex = levelProgress.findIndex(level => level.percentage < 100);
        const shouldAdvanceLevel = currentLevelIndex > 0 && levelProgress[currentLevelIndex - 1].percentage >= 80;
        
        const shouldAdvancePath = levelProgress.every(level => level.percentage >= 70);
        
        return {
            path: learningPath.path,
            levelProgress: levelProgress,
            overallProgress: {
                completed: totalSolved,
                total: totalProblems,
                percentage: overallPercentage
            },
            recommendations: {
                shouldAdvanceLevel: shouldAdvanceLevel,
                shouldAdvancePath: shouldAdvancePath,
                currentLevel: currentLevelIndex >= 0 ? currentLevelIndex + 1 : levelProgress.length
            }
        };
    },
    
    /**
     * Generate a single problem suggestion based on user's recent activity
     * @param {Object} userData - User data including submissions
     * @param {Object} problemsData - Problems data from API
     * @returns {Object} - Problem suggestion with reason
     */
    getDailyChallenge: function(userData, problemsData) {
        if (!userData || !problemsData || !problemsData.problems) {
            return null;
        }
        
        // Get user's current rating
        const userRating = userData.userInfo.rating || 800;
        
        // Get recent submissions
        const recentSubmissions = [...userData.submissions]
            .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
            .slice(0, 10);
        
        // Get solved problems
        const solvedProblems = new Set();
        userData.submissions
            .filter(sub => sub.verdict === 'OK')
            .forEach(sub => {
                const problemId = `${sub.problem.contestId}${sub.problem.index}`;
                solvedProblems.add(problemId);
            });
        
        // Get attempted but unsolved problems
        const attemptedProblems = new Set();
        userData.submissions.forEach(sub => {
            const problemId = `${sub.problem.contestId}${sub.problem.index}`;
            attemptedProblems.add(problemId);
        });
        
        // Check recent topics
        const recentTopics = new Map();
        recentSubmissions.forEach(sub => {
            if (sub.problem.tags) {
                sub.problem.tags.forEach(tag => {
                    recentTopics.set(tag, (recentTopics.get(tag) || 0) + 1);
                });
            }
        });
        
        // Find most frequent recent topic
        let mostFrequentTopic = null;
        let highestFrequency = 0;
        
        recentTopics.forEach((frequency, topic) => {
            if (frequency > highestFrequency) {
                highestFrequency = frequency;
                mostFrequentTopic = topic;
            }
        });
        
        // Suggest a problem
        let suggestedProblem;
        let reason;
        
        // First, try to suggest a problem from the most frequent recent topic
        if (mostFrequentTopic) {
            const topicProblems = problemsData.problems.filter(problem => {
                const problemId = `${problem.contestId}${problem.index}`;
                return !attemptedProblems.has(problemId) && 
                       problem.rating && 
                       problem.rating >= userRating - 100 && 
                       problem.rating <= userRating + 200 &&
                       problem.tags && 
                       problem.tags.includes(mostFrequentTopic);
            });
            
            if (topicProblems.length > 0) {
                // Select a random problem from the matching ones
                suggestedProblem = topicProblems[Math.floor(Math.random() * topicProblems.length)];
                reason = `Based on your recent interest in ${mostFrequentTopic} problems`;
            }
        }
        
        // If no suggestion yet, try to suggest a problem at user's rating level
        if (!suggestedProblem) {
            const ratingProblems = problemsData.problems.filter(problem => {
                const problemId = `${problem.contestId}${problem.index}`;
                return !attemptedProblems.has(problemId) && 
                       problem.rating && 
                       Math.abs(problem.rating - userRating) <= 100;
            });
            
            if (ratingProblems.length > 0) {
                // Select a random problem from the matching ones
                suggestedProblem = ratingProblems[Math.floor(Math.random() * ratingProblems.length)];
                reason = "Matches your current rating level for a balanced challenge";
            }
        }
        
        // If still no suggestion, find any appropriate problem
        if (!suggestedProblem) {
            const anyProblems = problemsData.problems.filter(problem => {
                const problemId = `${problem.contestId}${problem.index}`;
                return !attemptedProblems.has(problemId) && 
                       problem.rating && 
                       problem.rating >= userRating - 200 && 
                       problem.rating <= userRating + 300;
            });
            
            if (anyProblems.length > 0) {
                // Select a random problem from the matching ones
                suggestedProblem = anyProblems[Math.floor(Math.random() * anyProblems.length)];
                reason = "A fresh challenge to expand your skills";
            }
        }
        
        // If we found a problem, return it with the reason
        if (suggestedProblem) {
            return {
                problem: suggestedProblem,
                reason: reason,
                difficulty: this.getDifficultyDescription(suggestedProblem.rating, userRating)
            };
        }
        
        return null;
    },
    
    /**
     * Get a human-readable difficulty description
     * @param {number} problemRating - Problem's rating
     * @param {number} userRating - User's rating
     * @returns {string} - Difficulty description
     */
    getDifficultyDescription: function(problemRating, userRating) {
        const diff = problemRating - userRating;
        
        if (diff < -200) return "Much easier than your level";
        if (diff < -100) return "Easier than your level";
        if (diff < 0) return "Slightly easier than your level";
        if (diff === 0) return "Matches your exact level";
        if (diff <= 100) return "Slightly harder than your level";
        if (diff <= 200) return "Harder than your level";
        return "Much harder than your level";
    },
    
    /**
     * ML-based recommendations settings
     */
    ML_CONFIG: {
        apiUrl: 'http://localhost:5000',
        enabled: true,
        fallbackToRules: true
    },
    
    /**
     * Get ML-based recommendations for a user
     * @param {string} handle - User's Codeforces handle
     * @param {Object} options - Options for recommendations
     * @returns {Promise} - Promise with recommendations
     */
    getMLRecommendations: async function(handle, options = {}) {
        if (!this.ML_CONFIG.enabled) {
            console.log('ML recommendations are disabled, falling back to rule-based');
            return null;
        }
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('handle', handle);
            
            if (options.count) params.append('count', options.count);
            if (options.minRating) params.append('min_rating', options.minRating);
            if (options.maxRating) params.append('max_rating', options.maxRating);
            if (options.tags && options.tags.length > 0) {
                params.append('tags', options.tags.join(','));
            }
            
            // Make API request
            const response = await fetch(`${this.ML_CONFIG.apiUrl}/recommend?${params.toString()}`);
            const data = await response.json();
            
            if (data.recommendations && data.recommendations.length > 0) {
                return data.recommendations;
            } else {
                console.log('No ML recommendations found, falling back to rule-based');
                return null;
            }
        } catch (error) {
            console.error('Error fetching ML recommendations:', error);
            return null;
        }
    },
    
    /**
     * Get personalized ML recommendations based on user's recent activity
     * @param {string} handle - User's Codeforces handle
     * @param {Object} userData - User data including submissions
     * @param {Object} problemsData - Problems data from API
     * @returns {Promise} - Promise with recommendation
     */
    getPersonalizedMLRecommendation: async function(handle, userData, problemsData) {
        if (!handle || !userData || !problemsData) {
            return null;
        }
        
        // Get user's rating
        const userRating = userData.userInfo.rating || 800;
        
        // Get recent activity to determine tags
        const recentSubmissions = userData.submissions.slice(0, 20);
        const recentTopics = new Map();
        
        recentSubmissions.forEach(sub => {
            if (sub.problem.tags) {
                sub.problem.tags.forEach(tag => {
                    recentTopics.set(tag, (recentTopics.get(tag) || 0) + 1);
                });
            }
        });
        
        // Convert to array and sort by frequency
        const sortedTopics = [...recentTopics.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        // Get top 3 topics
        const topTags = sortedTopics.slice(0, 3);
        
        // Create options for ML recommendations
        const options = {
            count: 5,
            minRating: userRating - 100,
            maxRating: userRating + 200,
            tags: topTags
        };
        
        // Get ML recommendations
        const mlRecommendations = await this.getMLRecommendations(handle, options);
        
        if (mlRecommendations && mlRecommendations.length > 0) {
            // Select one recommendation
            const recommendation = mlRecommendations[0];
            
            return {
                problem: recommendation,
                reason: "Recommended by ML algorithm based on your solving patterns",
                difficulty: this.getDifficultyDescription(recommendation.rating, userRating),
                ml: true
            };
        }
        
        // Fall back to rule-based recommendation if ML fails
        if (this.ML_CONFIG.fallbackToRules) {
            return this.getNextProblemRecommendation(userData, problemsData);
        }
        
        return null;
    },
    
    /**
     * Get an entire learning path using ML recommendations
     * @param {string} handle - User's Codeforces handle
     * @param {Object} userData - User data including submissions
     * @param {Object} problemsData - Problems data from API
     * @returns {Promise} - Promise with ML-enhanced learning path
     */
    getMLLearningPath: async function(handle, userData, problemsData) {
        // First get the rule-based learning path
        const rulePath = this.generateLearningPath(userData, problemsData);
        
        if (!rulePath || !this.ML_CONFIG.enabled) {
            return rulePath;
        }
        
        try {
            // For each level in the path, enhance with ML recommendations
            for (let i = 0; i < rulePath.levels.length; i++) {
                const level = rulePath.levels[i];
                
                // Skip if already has enough problems
                if (level.problems.length >= level.count) {
                    continue;
                }
                
                // Get more problems using ML
                const options = {
                    count: level.count - level.problems.length,
                    minRating: level.ratingRange[0],
                    maxRating: level.ratingRange[1],
                    tags: level.focus
                };
                
                const mlRecommendations = await this.getMLRecommendations(handle, options);
                
                if (mlRecommendations && mlRecommendations.length > 0) {
                    // Add ML flag to these problems
                    mlRecommendations.forEach(prob => {
                        prob.ml = true;
                    });
                    
                    // Merge with existing problems
                    level.problems = [...level.problems, ...mlRecommendations];
                    
                    // Update the level
                    rulePath.levels[i] = level;
                }
            }
            
            // Add ML flag to the path
            rulePath.ml_enhanced = true;
            
            return rulePath;
        } catch (error) {
            console.error('Error enhancing learning path with ML:', error);
            return rulePath;
        }
    }
};

// Export the Recommendations module
window.Recommendations = Recommendations;
