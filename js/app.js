// Main application JavaScript for OpenSAT

document.addEventListener('DOMContentLoaded', function() {
    // Check if user needs to set up profile first
    if (!hasUserProfile()) {
        window.location.href = 'setup.html';
        return;
    }
    
    // Since index.html now checks for daily question completion,
    // we can skip that check here and focus on initializing the app
    
    // Initialize user data from localStorage or set defaults
    initUserData();
    
    // Update streak display
    updateStreakDisplay();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show welcome back message
    showWelcomeToast();
});

// GitHub Pages path prefix
const GITHUB_PAGES_PATH = '/SAT_Crack';

// Helper function to get correct paths
function getCorrectPath(path) {
    // If path already starts with the prefix, don't add it again
    if (path.startsWith(GITHUB_PAGES_PATH)) {
        return path;
    }
    
    // If path starts with a slash, just add the prefix
    if (path.startsWith('/')) {
        return GITHUB_PAGES_PATH + path;
    }
    
    // Otherwise add the prefix with a slash
    return GITHUB_PAGES_PATH + '/' + path;
}

function hasUserProfile() {
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    // Check if user data exists and has been set up (not using demo data)
    return userData && userData.hasSetup === true;
}

// Domain definitions for the app
const OPENSAT_DOMAINS = {
    'math': [
        'Algebra',
        'Problem-Solving and Data Analysis',
        'Advanced Math',
        'Geometry and Trigonometry'
    ],
    'english': [
        'Information and Ideas',
        'Craft and Structure',
        'Expression of Ideas',
        'Standard English Conventions'
    ]
};

// Domain mapping for progress tracking
const DOMAIN_TO_PROGRESS_KEY = {
    'Algebra': 'algebra',
    'Problem-Solving and Data Analysis': 'problem-solving',
    'Advanced Math': 'advanced-math',
    'Geometry and Trigonometry': 'geometry',
    'Information and Ideas': 'reading',
    'Craft and Structure': 'craft',
    'Expression of Ideas': 'writing',
    'Standard English Conventions': 'grammar'
};

// Progress key to display name mapping
const PROGRESS_KEY_TO_DISPLAY = {
    'algebra': 'Algebra',
    'problem-solving': 'Problem Solving & Data Analysis',
    'advanced-math': 'Advanced Math',
    'geometry': 'Geometry & Trigonometry',
    'reading': 'Information & Ideas',
    'craft': 'Craft & Structure',
    'writing': 'Expression of Ideas',
    'grammar': 'Standard English Conventions'
};

function initUserData() {
    // Check if user data exists in localStorage
    if (!localStorage.getItem('satCrackUserData')) {
        // Create empty user data structure without demo data
        const emptyUserData = {
            name: '',
            initials: '',
            streak: 0,
            lastActive: new Date().toISOString().split('T')[0],
            completedQuestions: 0,
            hasSetup: false,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            progress: {
                'algebra': 0,
                'problem-solving': 0,
                'advanced-math': 0,
                'geometry': 0,
                'reading': 0,
                'craft': 0,
                'writing': 0,
                'grammar': 0
            },
            achievements: [
                { id: 'math-master', name: 'Math Master', progress: 0, total: 20, unlocked: false },
                { id: 'reading-pro', name: 'Reading Pro', progress: 0, total: 20, unlocked: false },
                { id: 'streak-7', name: '7-Day Streak', progress: 0, total: 7, unlocked: false }
            ]
        };
        
        localStorage.setItem('satCrackUserData', JSON.stringify(emptyUserData));
        // Redirect to setup page
        window.location.href = 'setup.html';
        return;
    }
    
    // Check if we need to update the user data structure with new fields
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    // Add level system fields if they don't exist
    if (userData.level === undefined) {
        userData.level = 1;
        userData.xp = 0;
        userData.xpToNextLevel = 100;
        localStorage.setItem('satCrackUserData', JSON.stringify(userData));
    }
    
    // Check and update streak
    updateStreak();
}

function updateStreak() {
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    const today = new Date().toISOString().split('T')[0];
    
    // If last active was yesterday, increment streak
    const lastActive = new Date(userData.lastActive);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (userData.lastActive === yesterday.toISOString().split('T')[0]) {
        userData.streak += 1;
    } 
    // If last active was before yesterday, reset streak
    else if (new Date(userData.lastActive) < yesterday) {
        userData.streak = 0;
    }
    
    // Update last active to today
    userData.lastActive = today;
    
    // Save back to localStorage
    localStorage.setItem('satCrackUserData', JSON.stringify(userData));
}

function updateStreakDisplay() {
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    const streakCounter = document.querySelector('.streak-count');
    
    if (streakCounter && userData) {
        streakCounter.textContent = userData.streak || '0';
    }
    
    // Update user initials in profile button
    const profileButton = document.getElementById('profile-button');
    if (profileButton && userData && userData.initials) {
        const initialsSpan = profileButton.querySelector('span');
        if (initialsSpan) {
            initialsSpan.textContent = userData.initials;
        }
    }
}

function setupEventListeners() {
    // Topic buttons - update with current progress
    document.querySelectorAll('[href^="practice.html?topic="]').forEach(el => {
        const topicParam = new URL(el.href, window.location.origin).searchParams.get('topic');
        if (topicParam) {
            updateTopicProgress(el, topicParam);
        }
    });
    
    // Profile button
    const profileButton = document.getElementById('profile-button');
    if (profileButton) {
        profileButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }
    
    // Update goal progress
    updateGoalProgress();
}

function updateTopicProgress(element, topic) {
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    if (userData.progress && userData.progress[topic] !== undefined) {
        // Find progress display elements
        const progressBar = element.querySelector('.bg-blue-500, .bg-green-500, .bg-amber-500, .bg-pink-500, .bg-purple-500, .bg-indigo-500, .bg-teal-500');
        const progressText = element.querySelector('p.text-xs.text-gray-500');
        const titleElement = element.querySelector('h3.font-medium.text-sm');
        
        if (progressBar) {
            progressBar.style.width = `${userData.progress[topic]}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${userData.progress[topic]}% complete`;
        }
        
        // Update the title to use the proper display name if available
        if (titleElement && PROGRESS_KEY_TO_DISPLAY[topic]) {
            titleElement.textContent = PROGRESS_KEY_TO_DISPLAY[topic];
        }
    }
}

function updateGoalProgress() {
    // Update daily goal progress
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    const dailyData = JSON.parse(localStorage.getItem('satCrackDailyData')) || { completed: false };
    
    const dailyGoalBar = document.querySelector('.welcome-banner .bg-gradient-to-r');
    const dailyGoalText = document.querySelector('.welcome-banner .flex.justify-between span:first-child');
    const questionsCompletedText = document.querySelector('.welcome-banner .flex.justify-between span:last-child');
    
    if (dailyGoalBar && dailyGoalText && questionsCompletedText) {
        // Calculate progress percentage (daily question counts as 50%)
        let progressPercent = dailyData.completed ? 50 : 0;
        
        // Get today's completed questions (exclude the daily question)
        const today = new Date().toISOString().split('T')[0];
        const questionsToday = userData.completedQuestions || 0;
        
        // Aim for 5 regular questions per day (50% of progress) plus daily question
        const regularProgress = Math.min(50, (questionsToday / 5) * 50);
        progressPercent += regularProgress;
        
        // Update UI
        dailyGoalBar.style.width = `${progressPercent}%`;
        dailyGoalText.textContent = `Daily goal: ${Math.round(progressPercent)}%`;
        questionsCompletedText.textContent = `${questionsToday} questions today`;
    }
    
    // Update achievement progress
    const achievementElement = document.querySelector('.achievements-section .h-8.w-8 span');
    if (achievementElement) {
        const mathMaster = userData.achievements.find(a => a.id === 'math-master');
        if (mathMaster) {
            achievementElement.textContent = `${mathMaster.progress}/${mathMaster.total}`;
        }
    }
}

function showWelcomeToast() {
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-4 py-3 rounded-lg text-sm shadow-lg z-50 transition-opacity duration-500 fade-in';
    
    const name = userData.name || 'Student';
    const streak = userData.streak || 0;
    
    if (streak > 0) {
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="text-amber-500 mr-2">🔥</span>
                <span>Welcome back, <b>${name}</b>! ${streak} day streak!</span>
            </div>
        `;
    } else {
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="text-purple-500 mr-2">👋</span>
                <span>Welcome back, <b>${name}</b>!</span>
            </div>
        `;
    }
    
    // Add to body
    document.body.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// Store the install prompt event
let deferredPrompt;

// Check if the app can be installed and show a custom install button
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default prompt
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Check if we haven't shown the prompt recently
    const lastPromptTime = localStorage.getItem('satCrackInstallPromptTime');
    const now = new Date().getTime();
    
    // Only show if we haven't prompted in the last 3 days
    if (!lastPromptTime || (now - lastPromptTime > 3 * 24 * 60 * 60 * 1000)) {
        // Show install banner after 10 seconds
        setTimeout(() => {
            showInstallBanner();
        }, 10000);
    }
});

// Show custom install banner
function showInstallBanner() {
    if (!deferredPrompt) return;
    
    const banner = document.createElement('div');
    banner.className = 'fixed bottom-16 left-4 right-4 bg-white rounded-lg shadow-xl p-4 z-50 flex items-center justify-between';
    banner.innerHTML = `
        <div class="flex items-center">
            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">
                <span>📱</span>
            </div>
            <div>
                <h3 class="font-medium text-sm">Get the SAT Crack App</h3>
                <p class="text-xs text-gray-500">Install for the best experience</p>
            </div>
        </div>
        <div class="flex">
            <button id="dismiss-install" class="text-gray-400 px-2">
                <span>✕</span>
            </button>
            <button id="install-app" class="ml-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg">
                Install
            </button>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('install-app').addEventListener('click', async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        // Record that we've shown the prompt
        localStorage.setItem('satCrackInstallPromptTime', new Date().getTime());
        
        // Clear the deferred prompt
        deferredPrompt = null;
        
        // Remove the banner
        banner.remove();
    });
    
    document.getElementById('dismiss-install').addEventListener('click', () => {
        // Record that we've shown the prompt
        localStorage.setItem('satCrackInstallPromptTime', new Date().getTime());
        
        // Remove the banner
        banner.remove();
    });
}

// Helper functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Handle going back from practice to the previous page
window.addEventListener('popstate', function(event) {
    if (document.referrer.includes('practice.html')) {
        // Update the UI for completed questions
        updateGoalProgress();
    }
});
