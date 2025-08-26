/**
 * CodeFit - API Module
 * Handles all interactions with the Codeforces API
 */

const API = {
    BASE_URL: 'https://codeforces.com/api/',
    API_KEY: '',  // Your Codeforces API key
    API_SECRET: '',  // Your Codeforces API secret
    PERSONAL_HANDLE: '', // Your personal Codeforces handle
    DARK_MODE: false, // Dark mode preference
    
    /**
     * Set API credentials
     * @param {string} key - Codeforces API key
     * @param {string} secret - Codeforces API secret
     */
    setCredentials: function(key, secret) {
        this.API_KEY = key;
        this.API_SECRET = secret;
        localStorage.setItem('codefit_api_key', key);
        localStorage.setItem('codefit_api_secret', secret);
    },
    
    /**
     * Set personal handle
     * @param {string} handle - Your Codeforces handle
     */
    setPersonalHandle: function(handle) {
        this.PERSONAL_HANDLE = handle;
        localStorage.setItem('codefit_personal_handle', handle);
    },
    
    /**
     * Load API credentials and personal handle from localStorage
     */
    loadCredentials: function() {
        const key = localStorage.getItem('codefit_api_key');
        const secret = localStorage.getItem('codefit_api_secret');
        const handle = localStorage.getItem('codefit_personal_handle');
        const darkMode = localStorage.getItem('codefit_dark_mode');
        
        if (key && secret) {
            this.API_KEY = key;
            this.API_SECRET = secret;
        }
        
        if (handle) {
            this.PERSONAL_HANDLE = handle;
        }
        
        if (darkMode !== null) {
            this.DARK_MODE = darkMode === 'true';
        }
        
        return (key && secret) ? true : false;
    },
    
    /**
     * Toggle dark mode
     * @returns {boolean} - New dark mode state
     */
    toggleDarkMode: function() {
        this.DARK_MODE = !this.DARK_MODE;
        localStorage.setItem('codefit_dark_mode', this.DARK_MODE);
        return this.DARK_MODE;
    },
    
    /**
     * Set dark mode
     * @param {boolean} isDarkMode - Dark mode state
     */
    setDarkMode: function(isDarkMode) {
        this.DARK_MODE = isDarkMode;
        localStorage.setItem('codefit_dark_mode', isDarkMode);
    },
    
    /**
     * Generate authenticated API URL
     * @param {string} method - API method name
     * @param {Object} params - API parameters
     * @returns {string} - Authenticated URL
     */
    getAuthenticatedUrl: function(method, params = {}) {
        if (!this.API_KEY || !this.API_SECRET) {
            // Return non-authenticated URL if credentials are not set
            const queryParams = new URLSearchParams(params).toString();
            return `${this.BASE_URL}${method}?${queryParams}`;
        }
        
        // Add authentication parameters
        const authParams = {
            ...params,
            apiKey: this.API_KEY,
            time: Math.floor(Date.now() / 1000)
        };
        
        // Sort parameters alphabetically
        const sortedParams = {};
        Object.keys(authParams).sort().forEach(key => {
            sortedParams[key] = authParams[key];
        });
        
        // Build query string
        const queryString = new URLSearchParams(sortedParams).toString();
        
        // Create API signature
        const apiSig = this.generateApiSig(method, queryString);
        
        // Return full authenticated URL
        return `${this.BASE_URL}${method}?${queryString}&apiSig=${apiSig}`;
    },
    
    /**
     * Generate API signature
     * @param {string} method - API method name
     * @param {string} queryString - Sorted query string
     * @returns {string} - API signature
     */
    generateApiSig: function(method, queryString) {
        // Generate a random 6-character hex string
        const randHex = Math.random().toString(16).substring(2, 8);
        
        // Create the string to hash according to Codeforces API requirements
        const sigStr = `${randHex}/${method}?${queryString}#${this.API_SECRET}`;
        
        // Calculate SHA-512 hash using crypto-js
        const hash = CryptoJS.SHA512(sigStr).toString(CryptoJS.enc.Hex);
        
        // Return the signature: random prefix + hash
        return randHex + hash;
    },
    
    /**
     * Fetch user information
     * @param {string} handle - Codeforces user handle
     * @returns {Promise} - Promise with user data
     */
    getUserInfo: async function(handle) {
        try {
            const params = { handles: handle };
            const url = this.getAuthenticatedUrl('user.info', params);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'OK') {
                throw new Error(data.comment || 'Failed to fetch user data');
            }
            
            return data.result[0];
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    },
    
    /**
     * Fetch user's submission history
     * @param {string} handle - Codeforces user handle
     * @returns {Promise} - Promise with submissions data
     */
    getUserSubmissions: async function(handle) {
        try {
            const params = { handle, from: 1, count: 100 };
            const url = this.getAuthenticatedUrl('user.status', params);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'OK') {
                throw new Error(data.comment || 'Failed to fetch submission data');
            }
            
            return data.result;
        } catch (error) {
            console.error('Error fetching user submissions:', error);
            throw error;
        }
    },
    
    /**
     * Fetch user's rating history
     * @param {string} handle - Codeforces user handle
     * @returns {Promise} - Promise with rating data
     */
    getUserRating: async function(handle) {
        try {
            const params = { handle };
            const url = this.getAuthenticatedUrl('user.rating', params);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'OK') {
                throw new Error(data.comment || 'Failed to fetch rating data');
            }
            
            return data.result;
        } catch (error) {
            console.error('Error fetching user rating:', error);
            throw error;
        }
    },
    
    /**
     * Fetch all user data at once
     * @param {string} handle - Codeforces user handle
     * @returns {Promise} - Promise with all user data
     */
    getAllUserData: async function(handle) {
        try {
            const [userInfo, submissions, ratingHistory] = await Promise.all([
                this.getUserInfo(handle),
                this.getUserSubmissions(handle),
                this.getUserRating(handle)
            ]);
            
            return {
                userInfo,
                submissions,
                ratingHistory
            };
        } catch (error) {
            console.error('Error fetching all user data:', error);
            throw error;
        }
    },
    
    /**
     * Calculate user statistics from API data
     * @param {Object} data - Combined user data
     * @returns {Object} - Calculated statistics
     */
    calculateStats: function(data) {
        // Get unique solved problems
        const solvedProblems = new Set();
        const acceptedSubmissions = data.submissions.filter(sub => sub.verdict === 'OK');
        
        // Keep track of solved problems with their details
        const solvedProblemDetails = new Map();
        
        acceptedSubmissions.forEach(sub => {
            const problemId = `${sub.problem.contestId}${sub.problem.index}`;
            solvedProblems.add(problemId);
            
            // Store problem details if not already stored
            if (!solvedProblemDetails.has(problemId)) {
                solvedProblemDetails.set(problemId, {
                    name: sub.problem.name,
                    rating: sub.problem.rating,
                    tags: sub.problem.tags || [],
                    contestId: sub.problem.contestId,
                    index: sub.problem.index
                });
            }
        });
        
        // Calculate current streak
        const dateMap = new Map();
        acceptedSubmissions.forEach(sub => {
            const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
            dateMap.set(date, true);
        });
        
        const dates = Array.from(dateMap.keys()).sort((a, b) => new Date(b) - new Date(a));
        
        let streak = 0;
        if (dates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            // Check if solved today or yesterday to maintain streak
            if (dates[0] === today || dates[0] === yesterday) {
                streak = 1;
                
                let currentDate = new Date(dates[0]);
                for (let i = 1; i < dates.length; i++) {
                    const prevDate = new Date(dates[i]);
                    const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 1) {
                        streak++;
                        currentDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }
        
        // Calculate problem difficulty distribution
        const difficultyDistribution = {};
        acceptedSubmissions.forEach(sub => {
            if (sub.problem.rating) {
                const rating = sub.problem.rating;
                difficultyDistribution[rating] = (difficultyDistribution[rating] || 0) + 1;
            }
        });
        
        // Calculate tag distribution
        const tagDistribution = {};
        solvedProblemDetails.forEach(problem => {
            if (problem.tags && problem.tags.length > 0) {
                problem.tags.forEach(tag => {
                    tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
                });
            }
        });
        
        // Sort tags by frequency
        const sortedTags = Object.entries(tagDistribution)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));
        
        // Generate weekly activity data
        const weeklyActivity = this.generateWeeklyActivity(acceptedSubmissions);
        
        // Calculate achievements
        const achievements = this.calculateAchievements(data, solvedProblems.size, streak);
        
        return {
            problemsSolved: solvedProblems.size,
            currentStreak: streak,
            contestCount: data.ratingHistory.length,
            difficultyDistribution,
            tagDistribution: sortedTags,
            solvedProblems: Array.from(solvedProblemDetails.values()),
            weeklyActivity,
            achievements
        };
    },
    
    /**
     * Generate weekly activity heatmap data
     * @param {Array} submissions - User submissions
     * @returns {Object} - Weekly activity data
     */
    generateWeeklyActivity: function(submissions) {
        const activityMap = {};
        const now = new Date();
        
        // Initialize past 4 weeks with 0
        for (let i = 27; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            activityMap[dateString] = 0;
        }
        
        // Count submissions per day
        submissions.forEach(sub => {
            const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
            if (activityMap[date] !== undefined) {
                activityMap[date]++;
            }
        });
        
        // Convert to activity levels (0-4)
        const activityLevels = {};
        Object.keys(activityMap).forEach(date => {
            const count = activityMap[date];
            if (count === 0) {
                activityLevels[date] = 0;
            } else if (count <= 2) {
                activityLevels[date] = 1;
            } else if (count <= 5) {
                activityLevels[date] = 2;
            } else if (count <= 10) {
                activityLevels[date] = 3;
            } else {
                activityLevels[date] = 4;
            }
        });
        
        return activityLevels;
    },
    
    /**
     * Calculate user achievements
     * @param {Object} data - User data
     * @param {number} problemCount - Number of solved problems
     * @param {number} streak - Current streak
     * @returns {Array} - List of achievements
     */
    calculateAchievements: function(data, problemCount, streak) {
        const achievements = [
            {
                id: 'first-solve',
                title: 'First Blood',
                description: 'Solve your first problem',
                icon: 'trophy',
                unlocked: problemCount > 0,
                color: 'blue'
            },
            {
                id: '10-problems',
                title: 'Getting Started',
                description: 'Solve 10 problems',
                icon: 'code',
                unlocked: problemCount >= 10,
                color: 'green'
            },
            {
                id: '100-problems',
                title: 'Century',
                description: 'Solve 100 problems',
                icon: 'fire',
                unlocked: problemCount >= 100,
                color: 'orange'
            },
            {
                id: 'streak-7',
                title: 'Weekly Warrior',
                description: 'Maintain a 7-day streak',
                icon: 'calendar-check',
                unlocked: streak >= 7,
                color: 'purple'
            },
            {
                id: 'specialist',
                title: 'Specialist',
                description: 'Reach Specialist rank',
                icon: 'chart-line',
                unlocked: data.userInfo.rank && ['specialist', 'expert', 'candidate master', 'master', 'international master', 'grandmaster', 'international grandmaster', 'legendary grandmaster'].includes(data.userInfo.rank),
                color: 'teal'
            },
            {
                id: 'expert',
                title: 'Expert Coder',
                description: 'Reach Expert rank',
                icon: 'star',
                unlocked: data.userInfo.rank && ['expert', 'candidate master', 'master', 'international master', 'grandmaster', 'international grandmaster', 'legendary grandmaster'].includes(data.userInfo.rank),
                color: 'blue'
            },
            {
                id: 'candidate-master',
                title: 'Candidate Master',
                description: 'Reach Candidate Master rank',
                icon: 'crown',
                unlocked: data.userInfo.rank && ['candidate master', 'master', 'international master', 'grandmaster', 'international grandmaster', 'legendary grandmaster'].includes(data.userInfo.rank),
                color: 'purple'
            },
            {
                id: 'master',
                title: 'Master',
                description: 'Reach Master rank',
                icon: 'award',
                unlocked: data.userInfo.rank && ['master', 'international master', 'grandmaster', 'international grandmaster', 'legendary grandmaster'].includes(data.userInfo.rank),
                color: 'orange'
            },
            {
                id: '5-contests',
                title: 'Contest Enthusiast',
                description: 'Participate in 5 contests',
                icon: 'medal',
                unlocked: data.ratingHistory.length >= 5,
                color: 'yellow'
            },
            {
                id: 'rating-increase',
                title: 'On The Rise',
                description: 'Increase rating by 100+ in one contest',
                icon: 'rocket',
                unlocked: data.ratingHistory.some(contest => contest.newRating - contest.oldRating >= 100),
                color: 'red'
            }
        ];
        
        return achievements;
    }
};

// Export the API module
window.API = API;
