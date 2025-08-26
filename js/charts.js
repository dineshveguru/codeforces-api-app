/**
 * CodeFit - Charts Module
 * Handles all chart visualizations using Chart.js
 */

const Charts = {
    /**
     * Initialize charts with empty data
     */
    initCharts: function() {
        this.initRatingChart();
        this.initDifficultyChart();
        this.applyChartTheme();
    },
    
    /**
     * Apply theme to charts based on dark mode
     */
    applyChartTheme: function() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Set global chart defaults based on theme
        Chart.defaults.color = isDarkMode ? '#e3e3e3' : '#666';
        Chart.defaults.borderColor = isDarkMode ? '#374151' : '#ddd';
        
        // Update existing charts if they exist
        if (this.ratingChart) {
            this.ratingChart.options.scales.x.grid.color = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            this.ratingChart.options.scales.y.grid.color = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            this.ratingChart.update();
        }
        
        if (this.difficultyChart) {
            this.difficultyChart.update();
        }
    },
    
    /**
     * Initialize the rating progress chart
     */
    initRatingChart: function() {
        const ctx = document.getElementById('rating-chart').getContext('2d');
        
        this.ratingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Rating',
                    data: [],
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `Rating: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Rating'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Contest'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Initialize the difficulty distribution chart
     */
    initDifficultyChart: function() {
        const ctx = document.getElementById('difficulty-chart').getContext('2d');
        
        this.difficultyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(128, 128, 128, 0.7)',  // Grey - 800
                        'rgba(0, 128, 0, 0.7)',      // Green - 1000
                        'rgba(3, 168, 158, 0.7)',    // Cyan - 1200
                        'rgba(0, 0, 255, 0.7)',      // Blue - 1400
                        'rgba(170, 0, 170, 0.7)',    // Purple - 1600
                        'rgba(255, 140, 0, 0.7)',    // Orange - 1800
                        'rgba(255, 0, 0, 0.7)'       // Red - 2000+
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Update rating chart with user data
     * @param {Array} ratingHistory - User's rating history
     */
    updateRatingChart: function(ratingHistory) {
        if (!ratingHistory || ratingHistory.length === 0) {
            return;
        }
        
        // Sort contests by time
        const sortedHistory = [...ratingHistory].sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds);
        
        // Extract labels and data
        const labels = sortedHistory.map((contest, index) => `Contest ${index + 1}`);
        const data = sortedHistory.map(contest => contest.newRating);
        
        // Update chart data
        this.ratingChart.data.labels = labels;
        this.ratingChart.data.datasets[0].data = data;
        
        // Apply theme and update
        this.applyChartTheme();
        this.ratingChart.update();
    },
    
    /**
     * Update difficulty distribution chart
     * @param {Object} difficultyDistribution - Distribution of problems by difficulty
     */
    updateDifficultyChart: function(difficultyDistribution) {
        if (!difficultyDistribution) {
            return;
        }
        
        // Group difficulties into ranges
        const ranges = {
            '800-999': 0,
            '1000-1199': 0,
            '1200-1399': 0,
            '1400-1599': 0,
            '1600-1899': 0,
            '1900-2099': 0,
            '2100+': 0
        };
        
        // Fill the ranges
        Object.entries(difficultyDistribution).forEach(([difficulty, count]) => {
            const diff = parseInt(difficulty);
            
            if (diff < 1000) {
                ranges['800-999'] += count;
            } else if (diff < 1200) {
                ranges['1000-1199'] += count;
            } else if (diff < 1400) {
                ranges['1200-1399'] += count;
            } else if (diff < 1600) {
                ranges['1400-1599'] += count;
            } else if (diff < 1900) {
                ranges['1600-1899'] += count;
            } else if (diff < 2100) {
                ranges['1900-2099'] += count;
            } else {
                ranges['2100+'] += count;
            }
        });
        
        // Update chart data
        this.difficultyChart.data.labels = Object.keys(ranges);
        this.difficultyChart.data.datasets[0].data = Object.values(ranges);
        
        // Apply theme and update
        this.applyChartTheme();
        this.difficultyChart.update();
    },
    
    /**
     * Render weekly activity heatmap
     * @param {Object} activityData - Weekly activity data
     */
    renderWeeklyActivity: function(activityData) {
        const container = document.getElementById('weekly-activity');
        container.innerHTML = '';
        
        if (!activityData || Object.keys(activityData).length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400">
                    <i class="fas fa-chart-line text-4xl mb-2"></i>
                    <p>No activity data available</p>
                </div>
            `;
            return;
        }
        
        // Create week containers
        const weekContainer = document.createElement('div');
        weekContainer.className = 'flex flex-col';
        
        // Add day labels
        const dayLabels = document.createElement('div');
        dayLabels.className = 'flex justify-between text-xs text-gray-500 mb-1';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'w-5 text-center';
            dayLabel.textContent = day;
            dayLabels.appendChild(dayLabel);
        });
        
        container.appendChild(dayLabels);
        
        // Organize data by weeks
        const weeks = {};
        const dates = Object.keys(activityData).sort();
        
        dates.forEach(date => {
            const dayDate = new Date(date);
            const weekNum = Math.floor(dates.indexOf(date) / 7);
            
            if (!weeks[weekNum]) {
                weeks[weekNum] = Array(7).fill(null);
            }
            
            const dayOfWeek = dayDate.getDay();
            weeks[weekNum][dayOfWeek] = {
                date: date,
                level: activityData[date]
            };
        });
        
        // Render weeks
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'flex flex-col';
        
        Object.values(weeks).forEach(week => {
            const weekRow = document.createElement('div');
            weekRow.className = 'flex mb-1';
            
            week.forEach(day => {
                const dayBox = document.createElement('div');
                dayBox.className = `activity-day activity-level-${day ? day.level : 0}`;
                
                if (day) {
                    dayBox.title = `${day.date}: ${day.level > 0 ? (day.level === 1 ? '1-2' : day.level === 2 ? '3-5' : day.level === 3 ? '6-10' : '10+') : 0} submissions`;
                }
                
                weekRow.appendChild(dayBox);
            });
            
            weeksContainer.appendChild(weekRow);
        });
        
        container.appendChild(weeksContainer);
        
        // Add legend
        const legend = document.createElement('div');
        legend.className = 'flex items-center justify-center mt-4 text-xs text-gray-600';
        legend.innerHTML = `
            <div class="mr-1">Less</div>
            <div class="activity-day activity-level-0 mx-1"></div>
            <div class="activity-day activity-level-1 mx-1"></div>
            <div class="activity-day activity-level-2 mx-1"></div>
            <div class="activity-day activity-level-3 mx-1"></div>
            <div class="activity-day activity-level-4 mx-1"></div>
            <div class="ml-1">More</div>
        `;
        
        container.appendChild(legend);
    }
};

// Export the Charts module
window.Charts = Charts;
