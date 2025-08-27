/**
 * CodeFit - Main Application
 * Entry point for the Codeforces fitness tracker application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts // // 
    Charts.initCharts();
    
    // Initialize dark mode based on saved preference
    const darkModePreference = localStorage.getItem('codefit_dark_mode');
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    // Initialize ML settings
    const mlEnabled = localStorage.getItem('codefit_ml_enabled');
    if (mlEnabled !== null) {
        Recommendations.ML_CONFIG.enabled = mlEnabled === 'true';
    }
    
    // DOM Elements
    const usernameInput = document.getElementById('username-input');
    const searchBtn = document.getElementById('search-btn');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const mainContent = document.getElementById('main-content');
    const personalDashboardBtn = document.getElementById('personal-dashboard-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const refreshRecommendationsBtn = document.getElementById('refresh-recommendations-btn');
    
    // Global variables for recommendations
    let problemsData = null;
    let currentUserData = null;
    
    // API Settings Elements
    const apiSettingsBtn = document.getElementById('api-settings-btn');
    const apiSettingsModal = document.getElementById('api-settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const apiKeyInput = document.getElementById('api-key');
    const apiSecretInput = document.getElementById('api-secret');
    const personalHandleInput = document.getElementById('personal-handle');
    const darkModeSettings = document.getElementById('dark-mode-settings');
    const saveApiSettingsBtn = document.getElementById('save-api-settings-btn');
    
    // Add event listeners
    searchBtn.addEventListener('click', fetchUserData);
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchUserData();
        }
    });
    personalDashboardBtn.addEventListener('click', loadPersonalDashboard);
    refreshRecommendationsBtn.addEventListener('click', refreshRecommendations);
    
    // API Settings Modal event listeners
    apiSettingsBtn.addEventListener('click', openApiSettingsModal);
    closeModalBtn.addEventListener('click', closeApiSettingsModal);
    saveApiSettingsBtn.addEventListener('click', saveApiSettings);
    
    // Dark Mode Toggle event listener
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Try to load saved API credentials
    API.loadCredentials();
    
    // Initialize dark mode based on saved preference
    initializeDarkMode();
    
    // Check if personal handle is set and show the dashboard button
    if (API.PERSONAL_HANDLE) {
        personalDashboardBtn.textContent = `My Dashboard (${API.PERSONAL_HANDLE})`;
        personalDashboardBtn.classList.remove('hidden');
    }
    
    // Check if there's a username in localStorage
    const savedUsername = localStorage.getItem('codefit_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        fetchUserData();
    } else if (API.PERSONAL_HANDLE) {
        // If no saved username but personal handle exists, load personal dashboard
        loadPersonalDashboard();
    }
    
    /**
     * Open API Settings Modal
     */
    function openApiSettingsModal() {
        // Fill with saved values if available
        apiKeyInput.value = API.API_KEY || '';
        apiSecretInput.value = API.API_SECRET || '';
        personalHandleInput.value = API.PERSONAL_HANDLE || '';
        darkModeSettings.checked = API.DARK_MODE;
        document.getElementById('ml-recommendations-toggle').checked = Recommendations.ML_CONFIG.enabled;
        
        apiSettingsModal.classList.remove('hidden');
    }
    
    /**
     * Close API Settings Modal
     */
    function closeApiSettingsModal() {
        apiSettingsModal.classList.add('hidden');
    }
    
    /**
     * Save API Settings
     */
    function saveApiSettings() {
        const key = apiKeyInput.value.trim();
        const secret = apiSecretInput.value.trim();
        const handle = personalHandleInput.value.trim();
        const isDarkMode = darkModeSettings.checked;
        const useML = document.getElementById('ml-recommendations-toggle').checked;
        
        API.setCredentials(key, secret);
        API.setPersonalHandle(handle);
        
        // Update dark mode if changed
        if (API.DARK_MODE !== isDarkMode) {
            API.setDarkMode(isDarkMode);
            toggleDarkMode();
        }
        
        // Update ML settings
        Recommendations.ML_CONFIG.enabled = useML;
        localStorage.setItem('codefit_ml_enabled', useML.toString());
        
        // Show or hide personal dashboard button
        if (handle) {
            personalDashboardBtn.textContent = `My Dashboard (${handle})`;
            personalDashboardBtn.classList.remove('hidden');
        } else {
            personalDashboardBtn.classList.add('hidden');
        }
        
        closeApiSettingsModal();
        
        // Show feedback to user
        alert('Settings saved successfully.');
    }
    
    /**
     * Load personal dashboard
     */
    function loadPersonalDashboard() {
        if (!API.PERSONAL_HANDLE) {
            showError('Please set your personal Codeforces handle in settings first');
            return;
        }
        
        usernameInput.value = API.PERSONAL_HANDLE;
        fetchUserData();
    }
    
    /**
     * Fetch user data from Codeforces API
     */
    async function fetchUserData() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Please enter a Codeforces handle');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        mainContent.classList.add('hidden');
        
        try {
            // Save username to localStorage
            localStorage.setItem('codefit_username', username);
            
            // Fetch user data and problem data in parallel
            const fetchPromises = [API.getAllUserData(username)];
            
            // Only fetch problems data if we don't already have it
            if (!problemsData) {
                fetchPromises.push(API.getAllProblems());
            }
            
            const results = await Promise.all(fetchPromises);
            
            // Get user data
            currentUserData = results[0];
            
            // If we fetched problems data, save it
            if (results.length > 1) {
                problemsData = results[1];
            }
            
            // Calculate statistics
            const stats = API.calculateStats(currentUserData);
            
            // Update UI with user data
            updateUI(currentUserData, stats);
            
            // Generate and display recommendations
            if (problemsData) {
                try {
                    const recommendations = await API.generateRecommendations(currentUserData, problemsData);
                    displayRecommendations(recommendations);
                } catch (error) {
                    console.error('Error generating recommendations:', error);
                }
            }
            
            // Hide loading indicator and show content
            loadingIndicator.classList.add('hidden');
            mainContent.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Failed to fetch user data. Please check the handle and try again.');
            loadingIndicator.classList.add('hidden');
        }
    }
    
    /**
     * Update UI with user data
     * @param {Object} userData - User data from API
     * @param {Object} stats - Calculated statistics
     */
    function updateUI(userData, stats) {
        const { userInfo, submissions, ratingHistory } = userData;
        
        // Update user profile
        document.getElementById('user-handle').textContent = userInfo.handle;
        document.getElementById('user-rank').textContent = userInfo.rank || 'Unrated';
        document.getElementById('user-rank').className = `rank-${userInfo.rank || 'newbie'}`;
        document.getElementById('user-rating').textContent = userInfo.rating || 0;
        document.getElementById('max-rating').textContent = userInfo.maxRating || 0;
        document.getElementById('problems-solved').textContent = stats.problemsSolved;
        document.getElementById('contests-count').textContent = stats.contestCount;
        document.getElementById('current-streak').textContent = stats.currentStreak;
        
        // Set user avatar
        if (userInfo.titlePhoto) {
            document.getElementById('user-avatar').src = userInfo.titlePhoto;
        }
        
        // Update charts
        Charts.updateRatingChart(ratingHistory);
        Charts.updateDifficultyChart(stats.difficultyDistribution);
        Charts.renderWeeklyActivity(stats.weeklyActivity);
        
        // Update problem tags
        updateProblemTags(stats.tagDistribution);
        
        // Update recent submissions
        updateRecentSubmissions(submissions);
        
        // Update achievements
        updateAchievements(stats.achievements);
    }
    
    /**
     * Update problem tags visualization
     * @param {Array} tagDistribution - Distribution of problem tags
     */
    function updateProblemTags(tagDistribution) {
        const tagsContainer = document.getElementById('tags-container');
        tagsContainer.innerHTML = '';
        
        if (!tagDistribution || tagDistribution.length === 0) {
            tagsContainer.innerHTML = `
                <div class="text-center text-gray-400">
                    <i class="fas fa-tags text-4xl mb-2"></i>
                    <p>No problem tags found</p>
                </div>
            `;
            return;
        }
        
        // Create tags list
        const tagsList = document.createElement('div');
        tagsList.className = 'space-y-2';
        
        // Determine max count for scaling
        const maxCount = tagDistribution[0].count;
        
        // Create tag bars
        tagDistribution.forEach(({ tag, count }) => {
            const percentage = Math.round((count / maxCount) * 100);
            const tagBar = document.createElement('div');
            tagBar.className = 'flex flex-col';
            
            tagBar.innerHTML = `
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium">${tag}</span>
                    <span class="text-gray-500">${count}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            `;
            
            tagsList.appendChild(tagBar);
        });
        
        tagsContainer.appendChild(tagsList);
    }
    
    /**
     * Update recent submissions table
     * @param {Array} submissions - User submissions
     */
    function updateRecentSubmissions(submissions) {
        const submissionsTable = document.getElementById('submissions-table');
        submissionsTable.innerHTML = '';
        
        if (!submissions || submissions.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="3" class="py-4 text-center text-gray-500">No submissions found</td>
            `;
            submissionsTable.appendChild(emptyRow);
            return;
        }
        
        // Get most recent 10 submissions
        const recentSubmissions = submissions.slice(0, 10);
        
        recentSubmissions.forEach(submission => {
            const row = document.createElement('tr');
            
            // Format date
            const submissionDate = new Date(submission.creationTimeSeconds * 1000);
            const formattedDate = submissionDate.toLocaleDateString() + ' ' + submissionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Format status
            const status = submission.verdict === 'OK' ? 
                '<span class="status-ok"><i class="fas fa-check-circle"></i> Accepted</span>' : 
                `<span class="status-failed"><i class="fas fa-times-circle"></i> ${formatVerdict(submission.verdict)}</span>`;
            
            // Create problem link
            const problemLink = `https://codeforces.com/contest/${submission.problem.contestId}/problem/${submission.problem.index}`;
            
            row.innerHTML = `
                <td class="py-2 px-3 border-b border-gray-100">
                    <a href="${problemLink}" target="_blank" class="text-indigo-600 hover:text-indigo-800">
                        ${submission.problem.index}. ${submission.problem.name}
                        ${submission.problem.rating ? `<span class="text-xs font-semibold ml-1 px-1.5 py-0.5 rounded bg-gray-100">${submission.problem.rating}</span>` : ''}
                    </a>
                </td>
                <td class="py-2 px-3 border-b border-gray-100 text-sm text-gray-600">${formattedDate}</td>
                <td class="py-2 px-3 border-b border-gray-100">${status}</td>
            `;
            
            submissionsTable.appendChild(row);
        });
    }
    
    /**
     * Update achievements section
     * @param {Array} achievements - User achievements
     */
    function updateAchievements(achievements) {
        const achievementsContainer = document.getElementById('achievements-container');
        achievementsContainer.innerHTML = '';
        
        if (!achievements || achievements.length === 0) {
            achievementsContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-trophy text-4xl mb-2 opacity-30"></i>
                    <p>No achievements found</p>
                </div>
            `;
            return;
        }
        
        achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement p-4 rounded-lg ${achievement.unlocked ? 'unlocked bg-gradient-to-br from-white to-gray-100 shadow-md' : 'locked bg-gray-100'}`;
            
            achievementCard.innerHTML = `
                <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 flex items-center justify-center rounded-full mb-2 ${achievement.unlocked ? `bg-${achievement.color}-100 text-${achievement.color}-600` : 'bg-gray-200 text-gray-400'}">
                        <i class="fas fa-${achievement.icon} text-xl"></i>
                    </div>
                    <h4 class="font-semibold text-sm mb-1">${achievement.title}</h4>
                    <p class="text-xs text-gray-600">${achievement.description}</p>
                </div>
            `;
            
            achievementsContainer.appendChild(achievementCard);
        });
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
    
    /**
     * Format verdict string
     * @param {string} verdict - Submission verdict
     * @returns {string} - Formatted verdict
     */
    function formatVerdict(verdict) {
        if (!verdict) return 'In Queue';
        
        const verdictMap = {
            'FAILED': 'Failed',
            'OK': 'Accepted',
            'PARTIAL': 'Partial',
            'COMPILATION_ERROR': 'Compilation Error',
            'RUNTIME_ERROR': 'Runtime Error',
            'WRONG_ANSWER': 'Wrong Answer',
            'PRESENTATION_ERROR': 'Presentation Error',
            'TIME_LIMIT_EXCEEDED': 'Time Limit Exceeded',
            'MEMORY_LIMIT_EXCEEDED': 'Memory Limit Exceeded',
            'IDLENESS_LIMIT_EXCEEDED': 'Idleness Limit Exceeded',
            'SECURITY_VIOLATED': 'Security Violated',
            'CRASHED': 'Crashed',
            'INPUT_PREPARATION_CRASHED': 'Input Preparation Crashed',
            'CHALLENGED': 'Challenged',
            'SKIPPED': 'Skipped',
            'TESTING': 'Testing',
            'REJECTED': 'Rejected'
        };
        
        return verdictMap[verdict] || verdict;
    }
    
    /**
     * Initialize dark mode based on saved preference
     */
    function initializeDarkMode() {
        // Set the toggle to match saved preference
        darkModeToggle.checked = API.DARK_MODE;
        
        // Apply dark mode if enabled
        if (API.DARK_MODE) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    /**
     * Toggle dark mode
     */
    function toggleDarkMode() {
        const isDarkMode = darkModeToggle.checked;
        
        // Sync the other dark mode toggle if it exists
        if (darkModeSettings) {
            darkModeSettings.checked = isDarkMode;
        }
        
        // Save preference
        API.setDarkMode(isDarkMode);
        
        // Apply or remove dark mode class
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Update charts if they exist
        if (Charts.ratingChart) {
            Charts.ratingChart.update();
        }
        
        if (Charts.difficultyChart) {
            Charts.difficultyChart.update();
        }
    }
    
    /**
     * Refresh problem recommendations
     */
    async function refreshRecommendations() {
        if (!currentUserData) {
            showError('Please search for a user first');
            return;
        }
        
        try {
            // If we don't have problems data yet, fetch it
            if (!problemsData) {
                problemsData = await API.getAllProblems();
            }
            
            // Generate fresh recommendations
            const recommendations = await API.generateRecommendations(currentUserData, problemsData);
            
            // Display recommendations
            displayRecommendations(recommendations);
        } catch (error) {
            console.error('Error refreshing recommendations:', error);
            showError('Failed to refresh recommendations. Please try again.');
        }
    }
    
    /**
     * Display problem recommendations
     * @param {Object} recommendations - Recommendations object with categories
     */
    function displayRecommendations(recommendations) {
        if (!recommendations) {
            return;
        }
        
        const container = document.getElementById('recommendations-container');
        container.innerHTML = '';
        
        // Create categories map with friendly names and icons
        const categories = {
            ml: { name: 'ML Recommendation', icon: 'fas fa-robot', description: 'Smart recommendation by our ML algorithm' },
            practice: { name: 'Practice', icon: 'fas fa-dumbbell', description: 'Strengthen your skills with these problems' },
            challenge: { name: 'Challenge', icon: 'fas fa-bolt', description: 'These match your current level' },
            stretch: { name: 'Stretch', icon: 'fas fa-arrow-up', description: 'Push your limits with these harder problems' },
            weakAreas: { name: 'Weak Areas', icon: 'fas fa-wrench', description: 'Focus on improving these topics' }
        };
        
        // Function to get difficulty class
        const getDifficultyClass = rating => {
            if (rating < 1200) return 'newbie';
            if (rating < 1400) return 'pupil';
            if (rating < 1600) return 'specialist';
            if (rating < 1900) return 'expert';
            if (rating < 2100) return 'candidate-master';
            if (rating < 2400) return 'master';
            return 'grandmaster';
        };
        
        // Create a section for each category
        Object.entries(categories).forEach(([categoryKey, categoryInfo]) => {
            const problems = recommendations[categoryKey];
            
            if (!problems || problems.length === 0) {
                return;
            }
            
            // Create category header
            const categorySection = document.createElement('div');
            categorySection.className = 'mb-6';
            categorySection.innerHTML = `
                <div class="flex items-center mb-2">
                    <span class="recommendation-category ${categoryKey} mr-2">${categoryInfo.name}</span>
                    <i class="${categoryInfo.icon} mr-2"></i>
                    <span class="text-sm text-gray-600">${categoryInfo.description}</span>
                </div>
            `;
            
            // Create problems grid
            const problemsGrid = document.createElement('div');
            problemsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';
            
            // Add each problem
            problems.forEach(problem => {
                const problemCard = document.createElement('div');
                problemCard.className = `recommendation-card ${categoryKey} bg-gray-50 rounded-md shadow-sm p-3 hover:shadow-md transition-all`;
                
                // Format tags
                const tags = problem.tags 
                    ? problem.tags.map(tag => `<span class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1">${tag}</span>`).join('')
                    : '';
                
                // Create problem link
                const problemLink = `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`;
                
                problemCard.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <a href="${problemLink}" target="_blank" class="text-indigo-600 hover:text-indigo-800 font-medium">
                            ${problem.contestId}${problem.index}. ${problem.name}
                        </a>
                        <span class="difficulty-badge ${getDifficultyClass(problem.rating)}">${problem.rating}</span>
                    </div>
                    <div class="text-xs flex flex-wrap mt-2">${tags}</div>
                `;
                
                problemsGrid.appendChild(problemCard);
            });
            
            categorySection.appendChild(problemsGrid);
            container.appendChild(categorySection);
        });
        
        // Add instructions for using recommendations
        const instructions = document.createElement('div');
        instructions.className = 'mt-6 p-3 bg-indigo-50 text-indigo-700 rounded-md text-sm';
        instructions.innerHTML = `
            <p><i class="fas fa-lightbulb mr-1"></i> <strong>Pro Tip:</strong> After solving a problem, refresh the recommendations to get new suggestions based on your progress.</p>
        `;
        
        container.appendChild(instructions);
    }
});
