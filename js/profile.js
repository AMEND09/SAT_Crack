// Profile page JavaScript for SAT Crack

document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    const userData = loadUserData();
    
    // Update profile display
    updateProfileUI(userData);
    
    // Initialize progress chart
    initializeProgressChart(userData);
    
    // Update recent activity
    updateRecentActivity(userData);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize offline mode toggle
    initOfflineMode();
    
    // Initialize score predictor
    if (window.ScorePredictor) {
        updateScorePrediction();
    }
});

function loadUserData() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    // If no data exists, redirect to setup
    if (!userData || !userData.hasSetup) {
        window.location.href = 'setup.html';
        return null;
    }
    
    return userData;
}

function updateProfileUI(userData) {
    if (!userData) return;
    
    // Update user info
    document.querySelector('.profile-card h2').textContent = userData.name;
    
    // Update user initials
    const initialsElement = document.querySelector('.profile-card .w-16.h-16 span');
    if (initialsElement) {
        initialsElement.textContent = userData.initials || '';
    }
    
    // Update stats
    const streakElement = document.querySelector('.profile-card .font-bold.text-lg:nth-of-type(1)');
    if (streakElement) {
        streakElement.innerHTML = `${userData.streak || 0}`;
    }
    
    const questionsElement = document.querySelector('.profile-card .font-bold.text-lg:nth-of-type(2)');
    if (questionsElement) {
        questionsElement.textContent = userData.completedQuestions || 0;
    }
    
    // Update badges count - count unlocked achievements
    const unlockedAchievements = userData.achievements.filter(a => a.unlocked).length;
    const badgesElement = document.querySelector('.profile-card .font-bold.text-lg:nth-of-type(3)');
    if (badgesElement) {
        badgesElement.textContent = unlockedAchievements || 0;
    }
    
    // Update level info
    const levelElement = document.getElementById('user-level');
    if (levelElement) {
        levelElement.textContent = `${userData.level || 1}`;
    }
    
    // Update XP progress
    const xpProgressElement = document.getElementById('xp-progress');
    if (xpProgressElement) {
        const xpPercent = ((userData.xp || 0) / (userData.xpToNextLevel || 100)) * 100;
        xpProgressElement.style.width = `${Math.min(xpPercent, 100)}%`;
    }
    
    const xpTextElement = document.getElementById('xp-text');
    if (xpTextElement) {
        xpTextElement.textContent = `${userData.xp || 0}/${userData.xpToNextLevel || 100}`;
    }
    
    // Update achievements
    updateAchievements(userData.achievements);
}

function updateAchievements(achievements) {
    if (!achievements) return;
    
    const achievementsContainer = document.querySelector('.grid.grid-cols-3.gap-3');
    if (!achievementsContainer) return;
    
    // Get all achievement elements
    const achievementElements = achievementsContainer.querySelectorAll('.bg-white.rounded-lg');
    
    // Predefined achievements (keep in sync with setup.html)
    const achievementData = [
        { id: 'math-master', name: 'Math Master', emoji: '🏅', color: 'amber' },
        { id: 'reading-pro', name: 'Reading Pro', emoji: '📚', color: 'green' },
        { id: 'streak-7', name: '7-Day Streak', emoji: '🔥', color: 'purple' },
        { id: 'perfect-score', name: 'Perfect Score', emoji: '🌟', color: 'blue' }
    ];
    
    // Update each achievement element
    achievementData.forEach((data, index) => {
        if (index >= achievementElements.length) return;
        
        const element = achievementElements[index];
        const achievement = achievements.find(a => a.id === data.id);
        
        if (achievement) {
            // Calculate progress percentage
            const progressPercent = Math.round((achievement.progress / achievement.total) * 100);
            
            // Update UI based on unlocked status
            if (achievement.unlocked) {
                element.classList.remove('opacity-40');
                element.querySelector('p').textContent = data.name;
            } else {
                element.classList.add('opacity-40');
                element.querySelector('p').textContent = `${data.name} (${progressPercent}%)`;
            }
        }
    });
}

function initializeProgressChart(userData) {
    const ctx = document.getElementById('progress-chart');
    if (!ctx || !userData) return;
    
    // Prepare data for the chart
    const labels = [
        'Algebra', 
        'Problem Solving', 
        'Advanced Math', 
        'Geometry', 
        'Reading', 
        'Writing', 
        'Grammar'
    ];
    
    const data = [
        userData.progress.algebra || 0,
        userData.progress['problem-solving'] || 0,
        userData.progress['advanced-math'] || 0,
        userData.progress.geometry || 0,
        userData.progress.reading || 0,
        userData.progress.writing || 0,
        userData.progress.grammar || 0
    ];
    
    // Create the chart
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Your Progress',
                data: data,
                fill: true,
                backgroundColor: 'rgba(138, 92, 246, 0.2)',
                borderColor: 'rgb(138, 92, 246)',
                pointBackgroundColor: 'rgb(138, 92, 246)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(138, 92, 246)'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateRecentActivity(userData) {
    if (!userData) return;
    
    const activityContainer = document.getElementById('activity-container');
    if (!activityContainer) return;
    
    // Clear container
    activityContainer.innerHTML = '';
    
    // Check if user has completed any questions
    if (userData.completedQuestions <= 0) {
        activityContainer.innerHTML = `
            <div class="flex items-center justify-center py-6 text-gray-500">
                <p>Complete questions to see your activity</p>
            </div>
        `;
        return;
    }
    
    // Add sample activities based on user progress
    const activities = [];
    
    // Add activity for math questions if any
    const mathProgress = userData.progress.algebra + 
                         userData.progress['problem-solving'] + 
                         userData.progress['advanced-math'] + 
                         userData.progress.geometry;
    
    if (mathProgress > 0) {
        activities.push({
            icon: '✅',
            color: 'green',
            title: 'Practiced Math Questions',
            description: 'Answered questions correctly',
            time: 'Recently'
        });
    }
    
    // Add activity for english questions if any
    const englishProgress = userData.progress.reading + 
                           userData.progress.writing + 
                           userData.progress.grammar;
    
    if (englishProgress > 0) {
        activities.push({
            icon: '📚',
            color: 'blue',
            title: 'Practiced English Questions',
            description: 'Making progress in reading and writing',
            time: 'Recently'
        });
    }
    
    // Add streak activity if streak > 0
    if (userData.streak > 0) {
        activities.push({
            icon: '🔥',
            color: 'amber',
            title: `${userData.streak}-Day Streak`,
            description: 'Consistent practice',
            time: 'Today'
        });
    }
    
    // Add achievements if any unlocked
    const achievementsUnlocked = userData.achievements.filter(a => a.unlocked);
    if (achievementsUnlocked.length > 0) {
        activities.push({
            icon: '⭐',
            color: 'amber',
            title: `Unlocked ${achievementsUnlocked.length} Achievement${achievementsUnlocked.length > 1 ? 's' : ''}`,
            description: `${achievementsUnlocked.map(a => a.name).join(', ')}`,
            time: 'Recently'
        });
    }
    
    // If still no activities, add a placeholder
    if (activities.length === 0) {
        activities.push({
            icon: '📅',
            color: 'blue',
            title: 'Started SAT Preparation',
            description: 'Welcome to SAT Crack!',
            time: 'Recently'
        });
    }
    
    // Add activities to container
    activities.forEach(activity => {
        activityContainer.innerHTML += `
            <div class="flex items-center">
                <div class="w-10 h-10 bg-${activity.color}-100 rounded-full flex items-center justify-center text-${activity.color}-600 mr-3">
                    <span>${activity.icon}</span>
                </div>
                <div class="flex-1">
                    <h3 class="font-medium text-sm">${activity.title}</h3>
                    <p class="text-xs text-gray-500">${activity.description}</p>
                </div>
                <span class="text-xs text-gray-400">${activity.time}</span>
            </div>
        `;
    });
}

function setupEventListeners() {
    // Attach event handler to edit profile button
    const editProfileBtn = document.querySelector('.profile-card button');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Open modal to edit profile
            showEditProfileModal();
        });
    }
    
    // Set up file import
    const fileInput = document.getElementById('json-import');
    const fileName = document.getElementById('file-name');
    
    if (fileInput && fileName) {
        fileInput.addEventListener('change', async function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                fileName.textContent = file.name;
                
                const offlineStatus = document.getElementById('offline-status');
                offlineStatus.textContent = "Importing questions... Please wait.";
                offlineStatus.classList.remove('hidden');
                    
                try {
                    // Use the CacheUtils to import the file
                    if (window.CacheUtils) {
                        await window.CacheUtils.importOfflineQuestions(file);
                        
                        // Update the toggle state
                        const offlineToggle = document.getElementById('offline-toggle');
                        if (offlineToggle) {
                            offlineToggle.checked = true;
                        }
                        
                        // Show status
                        const stats = window.CacheUtils.getOfflineStorageStats();
                        offlineStatus.textContent = `${stats.totalQuestions} questions imported (${stats.storageUsed})`;
                        offlineStatus.className = "mt-2 text-xs text-green-700";
                    } else {
                        throw new Error('CacheUtils not available');
                    }
                } catch (error) {
                    console.error('Error importing questions:', error);
                    offlineStatus.textContent = error.message || "Failed to import questions. Please check file format.";
                    offlineStatus.className = "mt-2 text-xs text-red-700";
                }
            }
        });
    }
    
    // Set up offline toggle with improved handling
    const offlineToggle = document.getElementById('offline-toggle');
    if (offlineToggle) {
        offlineToggle.addEventListener('change', function() {
            const offlineStatus = document.getElementById('offline-status');
            
            if (this.checked) {
                // User wants to enable offline mode
                if (window.CacheUtils && window.CacheUtils.hasOfflineData()) {
                    // Has data, enable offline mode
                    window.CacheUtils.enableOfflineMode();
                    
                    // Show stats
                    const stats = window.CacheUtils.getOfflineStorageStats();
                    offlineStatus.textContent = `${stats.totalQuestions} questions available offline (${stats.storageUsed})`;
                    offlineStatus.className = "mt-2 text-xs text-green-700";
                    offlineStatus.classList.remove('hidden');
                } else {
                    // No user-uploaded data, ask if they want to use default or API
                    offlineStatus.textContent = "Loading questions from API/default source... Please wait.";
                    offlineStatus.className = "mt-2 text-xs text-blue-700";
                    offlineStatus.classList.remove('hidden');
                    
                    // Load questions from API or default
                    window.CacheUtils.loadDefaultQuestions()
                        .then(() => {
                            const stats = window.CacheUtils.getOfflineStorageStats();
                            if (window.CacheUtils.inMemoryQuestions) {
                                offlineStatus.textContent = `${stats.totalQuestions} questions loaded (in memory only - storage quota exceeded)`;
                            } else {
                                offlineStatus.textContent = `${stats.totalQuestions} questions loaded (${stats.storageUsed})`;
                            }
                            offlineStatus.className = "mt-2 text-xs text-green-700";
                            window.CacheUtils.enableOfflineMode();
                        })
                        .catch(error => {
                            console.error('Error loading questions:', error);
                            offlineStatus.textContent = "Failed to load questions: " + (error.message || "Unknown error");
                            offlineStatus.className = "mt-2 text-xs text-red-700";
                            this.checked = false;
                        });
                }
            } else {
                // User wants to disable offline mode
                if (window.CacheUtils) {
                    if (window.CacheUtils.hasOfflineData() && 
                        confirm('Would you like to remove offline questions data to save storage space?')) {
                        window.CacheUtils.clearOfflineData();
                        offlineStatus.textContent = "Offline questions removed.";
                    } else {
                        window.CacheUtils.disableOfflineMode();
                        offlineStatus.textContent = "Offline mode disabled. Questions still saved locally.";
                    }
                    
                    offlineStatus.className = "mt-2 text-xs text-blue-700";
                    offlineStatus.classList.remove('hidden');
                }
            }
        });
    }
    
    // Set up download questions button
    const downloadBtn = document.getElementById('download-questions-btn');
    if (downloadBtn && window.CacheUtils) {
        downloadBtn.addEventListener('click', function() {
            // Show downloading status
            const offlineStatus = document.getElementById('offline-status');
            offlineStatus.textContent = "Downloading questions file...";
            offlineStatus.className = "mt-2 text-xs text-blue-700";
            offlineStatus.classList.remove('hidden');
            
            // Trigger download
            window.CacheUtils.downloadDefaultQuestions()
                .then(() => {
                    offlineStatus.textContent = "Questions file downloaded successfully. Remember to import it when needed.";
                    offlineStatus.className = "mt-2 text-xs text-green-700";
                })
                .catch(error => {
                    console.error('Error downloading questions:', error);
                    offlineStatus.textContent = "Failed to download questions file. Please try again.";
                    offlineStatus.className = "mt-2 text-xs text-red-700";
                });
        });
    }
}

function showEditProfileModal() {
    // Get current user data
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    // Create modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
    
    modalOverlay.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 class="text-xl font-bold mb-4">Edit Profile</h2>
            
            <form id="edit-profile-form">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-medium mb-1" for="name">
                        Name
                    </label>
                    <input type="text" id="name" name="name" value="${userData.name || ''}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required>
                </div>
                
                <div class="mb-6">
                    <p class="text-gray-700 text-sm font-medium mb-1">Your Initials</p>
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center mr-3">
                            <span id="preview-initials" class="text-purple-700 font-bold">${userData.initials || ''}</span>
                        </div>
                        <p class="text-sm text-gray-500">Initials will be automatically generated from your name</p>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button type="button" id="cancel-edit" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modalOverlay);
    
    // Set up event listeners
    const nameInput = document.getElementById('name');
    const previewInitials = document.getElementById('preview-initials');
    const cancelBtn = document.getElementById('cancel-edit');
    const form = document.getElementById('edit-profile-form');
    
    // Update initials preview as user types
    nameInput.addEventListener('input', function() {
        const initials = generateInitials(this.value);
        previewInitials.textContent = initials;
    });
    
    // Close modal on cancel
    cancelBtn.addEventListener('click', function() {
        modalOverlay.remove();
    });
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newName = nameInput.value.trim();
        if (!newName) return;
        
        // Update user data
        userData.name = newName;
        userData.initials = generateInitials(newName);
        
        // Save to localStorage
        localStorage.setItem('satCrackUserData', JSON.stringify(userData));
        
        // Update UI
        updateProfileUI(userData);
        
        // Close modal
        modalOverlay.remove();
    });
}

function generateInitials(name) {
    if (!name) return '';
    
    // Split name into words
    const words = name.trim().split(/\s+/);
    
    if (words.length === 0) return '';
    
    // If only one word, use first two letters
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    } else {
        // Otherwise use first letter of each word (up to 2)
        return words.slice(0, 2)
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase();
    }
}

function initOfflineMode() {
    const offlineToggle = document.getElementById('offline-toggle');
    const offlineStatus = document.getElementById('offline-status');
    
    if (!offlineToggle || !offlineStatus) return;
    
    // Fix: Properly initialize the CacheUtils object if it doesn't exist
    if (!window.CacheUtils) {
        console.warn('CacheUtils not available for offline mode');
        offlineToggle.disabled = true;
        offlineStatus.textContent = "Offline mode not available";
        offlineStatus.className = "mt-2 text-xs text-red-700";
        offlineStatus.classList.remove('hidden');
        return;
    }
    
    // Fix: Ensure inMemoryQuestions is initialized to prevent errors
    if (!window.CacheUtils.inMemoryQuestions) {
        window.CacheUtils.inMemoryQuestions = null;
    }
    
    // Check if we have offline data and set initial state
    const hasOfflineData = window.CacheUtils && window.CacheUtils.hasOfflineData();
    const isOfflineModeEnabled = window.CacheUtils && window.CacheUtils.isOfflineModeEnabled();
    
    // Update the toggle state
    offlineToggle.checked = isOfflineModeEnabled;
    
    // Show status for different combinations
    if (isOfflineModeEnabled && hasOfflineData) {
        const stats = window.CacheUtils.getOfflineStorageStats();
        offlineStatus.textContent = `${stats.totalQuestions} questions available offline (${stats.storageUsed})`;
        offlineStatus.className = "mt-2 text-xs text-green-700";
        offlineStatus.classList.remove('hidden');
    } else if (isOfflineModeEnabled && !hasOfflineData) {
        // Inconsistent state: Fix it by attempting to load from API
        offlineStatus.textContent = "Offline mode enabled but no questions found. Loading from API...";
        offlineStatus.className = "mt-2 text-xs text-amber-700";
        offlineStatus.classList.remove('hidden');
        
        // Try to load questions
        if (window.CacheUtils) {
            window.CacheUtils.loadDefaultQuestions()
                .then(() => {
                    const stats = window.CacheUtils.getOfflineStorageStats();
                    offlineStatus.textContent = `${stats.totalQuestions} questions loaded (${stats.storageUsed})`;
                    offlineStatus.className = "mt-2 text-xs text-green-700";
                })
                .catch(error => {
                    console.error('Error auto-loading questions:', error);
                    offlineStatus.textContent = "Failed to auto-load questions. Try disabling and re-enabling offline mode.";
                    offlineStatus.className = "mt-2 text-xs text-red-700";
                });
        }
    } else if (hasOfflineData) {
        // Has data but offline mode not enabled
        offlineStatus.textContent = "Questions available for offline use. Enable toggle to use.";
        offlineStatus.className = "mt-2 text-xs text-blue-700";
        offlineStatus.classList.remove('hidden');
    } else {
        // No data, not enabled - show info
        offlineStatus.textContent = "Enable toggle to use offline mode with questions from API";
        offlineStatus.className = "mt-2 text-xs text-gray-700";
        offlineStatus.classList.remove('hidden');
    }
}

function updateScorePrediction() {
    // Get predicted scores
    const scorePrediction = ScorePredictor.calculateTotalScore();
    const domainBreakdown = ScorePredictor.getDomainBreakdown();
    const recommendations = ScorePredictor.getRecommendations();
    
    // Update score displays
    const totalScoreElement = document.getElementById('total-predicted-score');
    const mathScoreElement = document.getElementById('math-predicted-score');
    const englishScoreElement = document.getElementById('english-predicted-score');
    const scoreConfidenceElement = document.getElementById('score-confidence');
    
    if (totalScoreElement) {
        totalScoreElement.textContent = scorePrediction.confidence === 'none' ? '--' : scorePrediction.total;
    }
    
    if (mathScoreElement) {
        mathScoreElement.textContent = scorePrediction.confidence === 'none' ? '--' : scorePrediction.math;
    }
    
    if (englishScoreElement) {
        englishScoreElement.textContent = scorePrediction.confidence === 'none' ? '--' : scorePrediction.english;
    }
    
    // Update confidence indicator
    if (scoreConfidenceElement) {
        let confidenceText = 'Low Confidence';
        let confidenceClass = 'bg-yellow-100 text-yellow-800';
        
        if (scorePrediction.confidence === 'high') {
            confidenceText = 'High Confidence';
            confidenceClass = 'bg-green-100 text-green-800';
        } else if (scorePrediction.confidence === 'medium') {
            confidenceText = 'Medium Confidence';
            confidenceClass = 'bg-blue-100 text-blue-800';
        } else if (scorePrediction.confidence === 'none') {
            confidenceText = 'Insufficient Data';
            confidenceClass = 'bg-gray-100 text-gray-800';
        }
        
        scoreConfidenceElement.textContent = confidenceText;
        // Remove existing background classes and add new ones
        scoreConfidenceElement.className = 'text-xs font-medium ' + confidenceClass;
    }
    
    // Update domain breakdowns
    updateDomainBreakdown('math', domainBreakdown.math);
    updateDomainBreakdown('english', domainBreakdown.english);
    
    // Update recommendations
    updateRecommendations(recommendations);
    
    // Set up tab switching
    const tabs = document.querySelectorAll('#domain-tabs button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active classes from all tabs
            tabs.forEach(t => {
                t.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
                t.classList.add('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
            });
            
            // Add active class to clicked tab
            this.classList.remove('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
            this.classList.add('active', 'border-indigo-500', 'text-indigo-600');
            
            // Hide all content panels
            document.querySelectorAll('#domains-content > div').forEach(panel => {
                panel.classList.add('hidden');
            });
            
            // Show the targeted panel
            const targetId = this.getAttribute('data-tab');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });
}

function updateDomainBreakdown(section, data) {
    const containerElement = document.getElementById(`${section}-domains-breakdown`);
    if (!containerElement) return;
    
    // Clear container
    containerElement.innerHTML = '';
    
    // Check if any questions have been answered in this section
    let hasQuestions = false;
    for (const domain in data.domains) {
        if (data.domains[domain].total > 0) {
            hasQuestions = true;
            break;
        }
    }
    
    if (!hasQuestions) {
        containerElement.innerHTML = `
            <p class="text-gray-500 text-center py-3 text-sm">No ${section} questions attempted yet</p>
        `;
        return;
    }
    
    // Add domain items
    for (const domain in data.domains) {
        const domainData = data.domains[domain];
        if (domainData.total === 0) continue;
        
        // Calculate accuracy color
        let accuracyColor = 'bg-red-500';
        if (domainData.accuracy >= 80) {
            accuracyColor = 'bg-green-500';
        } else if (domainData.accuracy >= 60) {
            accuracyColor = 'bg-yellow-500';
        } else if (domainData.accuracy >= 40) {
            accuracyColor = 'bg-orange-500';
        }
        
        // Create domain item
        const domainItem = document.createElement('div');
        domainItem.className = 'bg-gray-50 rounded-lg p-3';
        domainItem.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <h5 class="text-sm font-medium text-gray-700">${domain}</h5>
                <span class="text-xs text-gray-500">${domainData.correct}/${domainData.total} correct</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
                <div class="${accuracyColor} h-1.5 rounded-full" style="width: ${domainData.accuracy}%"></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">${domainData.accuracy}% accuracy</p>
        `;
        
        containerElement.appendChild(domainItem);
    }
}

function updateRecommendations(recommendations) {
    const containerElement = document.getElementById('score-recommendations');
    if (!containerElement) return;
    
    // Clear container
    containerElement.innerHTML = '';
    
    if (recommendations.length === 0) {
        containerElement.innerHTML = `
            <p class="text-gray-500 text-sm">Answer more questions to get personalized recommendations</p>
        `;
        return;
    }
    
    // Add recommendation items
    recommendations.forEach(rec => {
        const recItem = document.createElement('div');
        recItem.className = 'bg-indigo-50 rounded-lg p-3 flex items-center justify-between';
        
        recItem.innerHTML = `
            <div class="flex items-center">
                <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                    <i data-lucide="lightbulb" class="w-4 h-4"></i>
                </div>
                <p class="text-sm text-indigo-800">${rec.message}</p>
            </div>
        `;
        
        if (rec.url) {
            const actionBtn = document.createElement('a');
            actionBtn.href = rec.url;
            actionBtn.className = 'text-xs bg-indigo-600 text-white py-1 px-2 rounded-lg';
            actionBtn.textContent = 'Practice';
            
            recItem.querySelector('.flex.items-center').after(actionBtn);
        }
        
        containerElement.appendChild(recItem);
    });
    
    // Make sure icons are rendered
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}