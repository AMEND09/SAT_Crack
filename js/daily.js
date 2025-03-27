// Daily question page script

// Global variables
let dailyQuestion = null;
let selectedAnswer = null;
let dailyData = null;
let userData = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Show loading overlay
    Loaders.showLoading('Loading Today\'s Challenge', 'Preparing your daily question');
    
    // Create skeleton loading UI
    Loaders.createQuestionSkeleton('#question-container');
    
    // Check if the user has already completed today's question
    initUserData();
    initDailyData();
    
    // Display current date
    displayCurrentDate();
    
    // Check if the user should be redirected directly to the main app
    if (shouldSkipDailyQuestion()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Show skip button if user has already seen this question today
    if (hasDailyQuestionBeenSeen()) {
        document.getElementById('skip-container').classList.remove('hidden');
        document.getElementById('skip-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Set up event listeners
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);
    document.getElementById('continue-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Load and display daily question
    try {
        await loadDailyQuestion();
        Loaders.hideLoading(500); // Hide loading overlay with a short delay
        renderQuestion();
    } catch (error) {
        console.error('Error loading daily question:', error);
        Loaders.hideLoading();
        showErrorMessage();
    }
});

function initUserData() {
    userData = JSON.parse(localStorage.getItem('satCrackUserData')) || {
        name: 'SAT Student',
        streak: 0,
        streakDate: '',
        lastActive: new Date().toISOString().split('T')[0],
        completedQuestions: 0,
        progress: {
            'algebra': 0,
            'problem-solving': 0,
            'advanced-math': 0,
            'geometry': 0,
            'reading': 0,
            'writing': 0,
            'grammar': 0
        },
        achievements: [
            { id: 'math-master', name: 'Math Master', progress: 0, total: 20, unlocked: false },
            { id: 'reading-pro', name: 'Reading Pro', progress: 0, total: 20, unlocked: false },
            { id: 'streak-7', name: '7-Day Streak', progress: 0, total: 7, unlocked: false }
        ]
    };
    
    // Update streak display
    document.getElementById('streak-count').textContent = userData.streak || '0';
    
    // Check and update streak
    updateStreak();
}

function initDailyData() {
    dailyData = JSON.parse(localStorage.getItem('satCrackDailyData')) || {
        lastQuestionDate: '',
        completed: false,
        seen: false,
        questionId: null
    };
    
    // Reset daily data if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (dailyData.lastQuestionDate !== today) {
        dailyData = {
            lastQuestionDate: today,
            completed: false,
            seen: false,
            questionId: null
        };
        localStorage.setItem('satCrackDailyData', JSON.stringify(dailyData));
    }
}

function shouldSkipDailyQuestion() {
    // Skip if daily question already completed today
    return dailyData.completed;
}

function hasDailyQuestionBeenSeen() {
    // Return true if the user has seen but not completed the question
    return dailyData.seen && !dailyData.completed;
}

function displayCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('date-display').textContent = today.toLocaleDateString('en-US', options);
}

function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    
    // If user already updated streak today, don't do anything
    if (userData.streakDate === today) {
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // If last active was yesterday, increment streak
    if (userData.lastActive === yesterdayString) {
        userData.streak += 1;
    }
    // If last active was before yesterday, reset streak
    else if (userData.lastActive < yesterdayString) {
        userData.streak = 0;
    }
    
    // Update last active to today
    userData.lastActive = today;
    userData.streakDate = today;
    
    // Check streak achievement
    const streakAchievement = userData.achievements.find(a => a.id === 'streak-7');
    if (streakAchievement && userData.streak >= 7 && !streakAchievement.unlocked) {
        streakAchievement.unlocked = true;
        streakAchievement.progress = 7;
    } else if (streakAchievement) {
        streakAchievement.progress = Math.min(7, userData.streak);
    }
    
    // Save to localStorage
    localStorage.setItem('satCrackUserData', JSON.stringify(userData));
    
    // Update streak display
    document.getElementById('streak-count').textContent = userData.streak || '0';
}

async function loadDailyQuestion() {
    try {
        // Mark the question as seen
        dailyData.seen = true;
        localStorage.setItem('satCrackDailyData', JSON.stringify(dailyData));
        
        // If we already have a question ID for today, use it
        if (dailyData.questionId) {
            // Try to get from CacheUtils first if available
            if (window.CacheUtils) {
                const cachedQuestion = window.CacheUtils.getCachedQuestion(dailyData.questionId);
                if (cachedQuestion) {
                    dailyQuestion = cachedQuestion;
                    return;
                }
            }
            
            // Fall back to standard localStorage
            const cachedQuestion = JSON.parse(localStorage.getItem(`question_${dailyData.questionId}`));
            if (cachedQuestion) {
                dailyQuestion = cachedQuestion;
                return;
            }
        }
        
        // Try to get all questions from cache first
        let data = null;
        
        if (window.CacheUtils) {
            data = window.CacheUtils.getAllCachedQuestions();
        }
        
        // If no cached data or cache needs update, fetch from API
        if (!data || (window.CacheUtils && window.CacheUtils.needsUpdate())) {
            const response = await fetch('https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5');
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            
            data = await response.json();
            
            // Cache all questions if utilities available
            if (window.CacheUtils) {
                window.CacheUtils.cacheAllQuestions(data);
            }
        }
        
        // Select a question based on the current date
        const today = new Date().toISOString().split('T')[0];
        const dateHash = hashString(today);
        
        // Select a section (math or english) based on the date
        const section = dateHash % 2 === 0 ? 'math' : 'english';
        
        // Get a consistent question for today
        const sectionQuestions = data[section];
        const questionIndex = dateHash % sectionQuestions.length;
        dailyQuestion = sectionQuestions[questionIndex];
        
        // Save the question ID for today
        dailyData.questionId = dailyQuestion.id;
        localStorage.setItem('satCrackDailyData', JSON.stringify(dailyData));
        
        // Cache the question
        if (window.CacheUtils) {
            window.CacheUtils.cacheQuestion(dailyQuestion);
        } else {
            localStorage.setItem(`question_${dailyQuestion.id}`, JSON.stringify(dailyQuestion));
        }
        
    } catch (error) {
        console.error('Error loading daily question:', error);
        throw error;
    }
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function renderQuestion() {
    // Clear loading placeholders
    const questionContainer = document.getElementById('question-container');
    const choicesContainer = document.getElementById('choices-container');
    
    // Reset containers
    questionContainer.innerHTML = '';
    choicesContainer.innerHTML = '';
    
    // Add fade-in animation classes
    questionContainer.classList.add('fade-in-cascade');
    choicesContainer.classList.add('fade-in-cascade');
    
    // Create paragraph if exists
    if (dailyQuestion.question.paragraph && dailyQuestion.question.paragraph !== 'null') {
        const paragraphElem = document.createElement('div');
        paragraphElem.className = 'bg-gray-50 p-3 rounded-lg mb-4 border-l-4 border-purple-400';
        paragraphElem.textContent = dailyQuestion.question.paragraph;
        questionContainer.appendChild(paragraphElem);
        
        // Render LaTeX in paragraph
        if (window.KaTeXUtils) {
            KaTeXUtils.renderMath(paragraphElem);
        } else if (typeof renderMathInElement === 'function') {
            renderMathInElement(paragraphElem, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true},
                    {left: "\\begin{equation}", right: "\\end{equation}", display: true},
                    {left: "\\begin{align}", right: "\\end{align}", display: true},
                    {left: "\\begin{alignat}", right: "\\end{alignat}", display: true},
                    {left: "\\begin{gather}", right: "\\end{gather}", display: true},
                    {left: "\\begin{CD}", right: "\\end{CD}", display: true}
                ],
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
            });
        }
    }
    
    // Create question text
    const questionElem = document.createElement('h2');
    questionElem.className = 'text-lg font-medium text-gray-800 mb-3';
    questionElem.textContent = dailyQuestion.question.question;
    questionContainer.appendChild(questionElem);
    
    // Render LaTeX in question
    if (window.KaTeXUtils) {
        KaTeXUtils.renderMath(questionElem);
    } else if (typeof renderMathInElement === 'function') {
        renderMathInElement(questionElem, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true},
                {left: "\\begin{equation}", right: "\\end{equation}", display: true},
                {left: "\\begin{align}", right: "\\end{align}", display: true},
                {left: "\\begin{alignat}", right: "\\end{alignat}", display: true},
                {left: "\\begin{gather}", right: "\\end{gather}", display: true},
                {left: "\\begin{CD}", right: "\\end{CD}", display: true}
            ],
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
        });
    }
    
    // Add image if exists
    if (dailyQuestion.visuals && 
        dailyQuestion.visuals.type !== 'null' && 
        dailyQuestion.visuals.svg_content !== 'null') {
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'my-4';
        
        if (dailyQuestion.visuals.type === 'image' || 
            dailyQuestion.visuals.svg_content.startsWith('http')) {
            const image = document.createElement('img');
            image.src = dailyQuestion.visuals.svg_content;
            image.className = 'rounded-lg w-full';
            image.alt = 'Question visual';
            imageContainer.appendChild(image);
        } 
        else if (dailyQuestion.visuals.type === 'svg') {
            imageContainer.innerHTML = dailyQuestion.visuals.svg_content;
        }
        
        questionContainer.appendChild(imageContainer);
    }
    
    // Create answer choices
    Object.entries(dailyQuestion.question.choices).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.className = 'answer-btn w-full py-3 px-4 rounded-lg border-2 border-gray-200 text-left flex items-center';
        button.dataset.choice = key;
        
        button.innerHTML = `
            <span class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                ${key}
            </span>
            <span>${value}</span>
        `;
        
        button.addEventListener('click', () => selectAnswer(key));
        choicesContainer.appendChild(button);
        
        // Render LaTeX in answer choices
        if (window.KaTeXUtils) {
            KaTeXUtils.renderMath(button);
        } else if (typeof renderMathInElement === 'function') {
            renderMathInElement(button, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true},
                    {left: "\\begin{equation}", right: "\\end{equation}", display: true},
                    {left: "\\begin{align}", right: "\\end{align}", display: true},
                    {left: "\\begin{alignat}", right: "\\end{alignat}", display: true},
                    {left: "\\begin{gather}", right: "\\end{gather}", display: true},
                    {left: "\\begin{CD}", right: "\\end{CD}", display: true}
                ],
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
            });
        }
    });
    
    // Enable submit button
    document.getElementById('submit-btn').classList.remove('opacity-50');
    document.getElementById('submit-btn').disabled = false;
}

function selectAnswer(choice) {
    selectedAnswer = choice;
    
    // Update button styles
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.classList.remove('border-purple-500', 'bg-purple-50');
        
        const indicator = btn.querySelector('span:first-child');
        indicator.classList.remove('bg-purple-500', 'text-white', 'border-purple-500');
        indicator.classList.add('border-gray-300');
    });
    
    // Style selected button
    const selectedButton = document.querySelector(`.answer-btn[data-choice="${choice}"]`);
    selectedButton.classList.add('border-purple-500', 'bg-purple-50');
    
    const indicator = selectedButton.querySelector('span:first-child');
    indicator.classList.remove('border-gray-300');
    indicator.classList.add('bg-purple-500', 'text-white', 'border-purple-500');
}

function submitAnswer() {
    if (!selectedAnswer) {
        return;
    }
    
    const correctAnswer = dailyQuestion.question.correct_answer;
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Mark daily question as completed
    dailyData.completed = true;
    localStorage.setItem('satCrackDailyData', JSON.stringify(dailyData));
    
    // Update user stats
    userData.completedQuestions++;
    
    // Use the domains utility if available
    const domains = window.OpenSATDomains ? window.OpenSATDomains.DOMAINS : {
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
    
    // Use the progress key mapping if available
    const domainToProgressKey = window.OpenSATDomains ? window.OpenSATDomains.DOMAIN_TO_PROGRESS_KEY : {
        'Algebra': 'algebra',
        'Problem-Solving and Data Analysis': 'problem-solving',
        'Advanced Math': 'advanced-math',
        'Geometry and Trigonometry': 'geometry',
        'Information and Ideas': 'reading',
        'Craft and Structure': 'craft',
        'Expression of Ideas': 'writing',
        'Standard English Conventions': 'grammar'
    };
    
    // Update topic progress based on question domain
    const progressKey = domainToProgressKey[dailyQuestion.domain];
    if (progressKey && userData.progress[progressKey] !== undefined) {
        userData.progress[progressKey] = Math.min(100, userData.progress[progressKey] + 2);
    }
    
    // Check if the domain belongs to math or english for achievement tracking
    const isMathDomain = domains.math.includes(dailyQuestion.domain);
                   
    if (isMathDomain) {
        const mathAchievement = userData.achievements.find(a => a.id === 'math-master');
        if (mathAchievement) {
            mathAchievement.progress = Math.min(mathAchievement.total, mathAchievement.progress + 1);
            if (mathAchievement.progress >= mathAchievement.total && !mathAchievement.unlocked) {
                mathAchievement.unlocked = true;
            }
        }
    } else {
        const readingAchievement = userData.achievements.find(a => a.id === 'reading-pro');
        if (readingAchievement) {
            readingAchievement.progress = Math.min(readingAchievement.total, readingAchievement.progress + 1);
            if (readingAchievement.progress >= readingAchievement.total && !readingAchievement.unlocked) {
                readingAchievement.unlocked = true;
            }
        }
    }
    
    // Save user data
    localStorage.setItem('satCrackUserData', JSON.stringify(userData));
    
    // Show the result modal
    showResultModal(isCorrect);
    
    // If incorrect, highlight the correct answer on the current screen
    if (!isCorrect) {
        // Find and highlight the correct answer button
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => {
            const choice = btn.dataset.choice;
            
            if (choice === correctAnswer) {
                // Highlight the correct answer with a pulse animation
                btn.classList.add('border-green-500', 'bg-green-50');
                const indicator = btn.querySelector('span:first-child');
                if (indicator) {
                    indicator.classList.remove('border-gray-300');
                    indicator.classList.add('bg-green-500', 'text-white', 'border-green-500');
                }
                
                // Add a pulsing animation
                btn.classList.add('pulse-animation');
            }
        });
        
        // Add shake animation to the wrong answer
        const wrongButton = document.querySelector(`.answer-btn[data-choice="${selectedAnswer}"]`);
        if (wrongButton) {
            wrongButton.classList.add('shake');
            setTimeout(() => wrongButton.classList.remove('shake'), 500);
        }
    }
}

function showResultModal(isCorrect) {
    const resultModal = document.getElementById('result-modal');
    const resultContent = document.getElementById('result-content');
    
    // Create result content
    let contentHTML = '';
    
    if (isCorrect) {
        contentHTML = `
            <div class="text-5xl mb-4">🎉</div>
            <h2 class="text-2xl font-bold text-green-600 mb-2">Correct!</h2>
            <p class="text-gray-600 mb-4">Great job! You've answered today's question correctly.</p>
        `;
        
        // Show confetti for correct answers
        showConfetti();
    } else {
        contentHTML = `
            <div class="text-5xl mb-4">📚</div>
            <h2 class="text-2xl font-bold text-red-600 mb-2">Incorrect</h2>
            <p class="text-gray-600 mb-4">The correct answer was <span class="font-semibold bg-green-100 px-2 py-1 rounded">${dailyQuestion.question.correct_answer}: ${dailyQuestion.question.choices[dailyQuestion.question.correct_answer]}</span></p>
            <p class="text-gray-600 mb-4">But don't worry - learning from mistakes is how we improve!</p>
        `;
    }
    
    // Add explanation
    contentHTML += `
        <div class="bg-gray-50 p-3 rounded-lg text-left">
            <h3 class="font-semibold mb-1">Explanation:</h3>
            <p id="explanation-text" class="text-sm text-gray-700">${dailyQuestion.question.explanation}</p>
        </div>
    `;
    
    resultContent.innerHTML = contentHTML;
    
    // Render LaTeX in explanation
    const explanationText = document.getElementById('explanation-text');
    if (explanationText) {
        if (window.KaTeXUtils) {
            KaTeXUtils.renderMath(explanationText);
        } else if (typeof renderMathInElement === 'function') {
            renderMathInElement(explanationText, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true},
                    {left: "\\begin{equation}", right: "\\end{equation}", display: true},
                    {left: "\\begin{align}", right: "\\end{align}", display: true},
                    {left: "\\begin{alignat}", right: "\\end{alignat}", display: true},
                    {left: "\\begin{gather}", right: "\\end{gather}", display: true},
                    {left: "\\begin{CD}", right: "\\end{CD}", display: true}
                ],
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
            });
        }
    }
    
    // Show the modal
    resultModal.classList.remove('hidden');
}

function showConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 100
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#8a5cf6', '#67e8f9', '#f472b6', '#34d399', '#fbbf24']
        }));
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#8a5cf6', '#67e8f9', '#f472b6', '#34d399', '#fbbf24']
        }));
    }, 250);
}

function hideLoadingOverlay() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showErrorMessage() {
    const questionContainer = document.getElementById('question-container');
    const choicesContainer = document.getElementById('choices-container');
    
    questionContainer.innerHTML = `
        <div class="text-center py-6">
            <div class="text-5xl mb-4">😕</div>
            <h2 class="text-xl font-semibold text-gray-700">Oops! Couldn't load today's question</h2>
            <p class="text-gray-500 mt-2">Please try again later</p>
        </div>
    `;
    
    choicesContainer.innerHTML = '';
    
    // Enable skip button
    document.getElementById('skip-container').classList.remove('hidden');
    document.getElementById('skip-btn').textContent = 'Continue to App ↗️';
    
    // Hide loading overlay
    hideLoadingOverlay();
}
