// Practice page JavaScript for OpenSAT

let questionsData = null;
let currentQuestion = null;
let currentQuestionIndex = 0;
let selectedAnswer = null;
let totalQuestions = 5; // Default number of questions per session
let lives = 3;
let correctAnswers = 0;
let topic = '';
let section = '';
let mode = '';
let hasShownHint = false;
let timerInterval = null;
let remainingTime = 0;
let baseTimePerQuestion = 60; // Base time in seconds for level 1
let userData = null; // Store the user data
let xpGained = 0; // Track XP gained in current session

document.addEventListener('DOMContentLoaded', async function() {
    // Show loading overlay
    if (window.Loaders) {
        Loaders.showLoading('Loading Questions', 'Preparing your practice session');
    }
    
    // Initialize user data
    userData = JSON.parse(localStorage.getItem('satCrackUserData')) || { level: 1 };
    
    // Get query params
    const urlParams = new URLSearchParams(window.location.search);
    topic = urlParams.get('topic');
    mode = urlParams.get('mode');
    
    // Set up topic badge
    updateTopicBadge();
    
    // Update level display
    updateLevelDisplay();
    
    // Set up close button
    const closeBtn = document.getElementById('close-quiz');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to exit? Your progress will not be saved.')) {
                window.location.href = 'index.html';
            }
        });
    }
    
    // Set up check button
    const checkBtn = document.getElementById('check-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', checkAnswer);
        checkBtn.disabled = true;
    }
    
    // Set up continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', loadNextQuestion);
    }
    
    // Set up hint button
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.addEventListener('click', showHint);
    }
    
    // Initialize lucide icons if available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Load questions
    try {
        await fetchQuestionsData();
        await loadQuestion();
        
        // Hide loading overlay
        if (window.Loaders) {
            Loaders.hideLoading();
        } else {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please try again.');
        
        // Hide loading overlay on error too
        if (window.Loaders) {
            Loaders.hideLoading();
        } else {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }
    
    // Start performance monitoring
    if (window.PerformanceMonitor) {
        window.PerformanceMonitor.recordPageLoad('practice');
    }
    
    // Set up mode-specific elements
    setupModeSpecificElements();
    
    // Initialize lucide icons if available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Apply content optimizations if available
    if (window.ContentLoader) {
        window.ContentLoader.optimizeCurrentPage();
    }
    
    // Preload likely topics and optimize loading
    preloadContent();
    
    // Load questions with performance tracking
    try {
        const fetchTimer = window.PerformanceMonitor ? 
            window.PerformanceMonitor.startTimer('fetchQuestions') : null;
            
        await fetchQuestionsData();
        
        if (fetchTimer) {
            window.PerformanceMonitor.endTimer(fetchTimer, 'api');
        }
        
        const loadTimer = window.PerformanceMonitor ? 
            window.PerformanceMonitor.startTimer('loadQuestion') : null;
            
        await loadQuestion();
        
        if (loadTimer) {
            window.PerformanceMonitor.endTimer(loadTimer, 'render');
        }
        
        // Hide loading overlay
        if (window.Loaders) {
            Loaders.hideLoading();
        } else {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please try again.');
        
        // Hide loading overlay on error too
        if (window.Loaders) {
            Loaders.hideLoading();
        } else {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }
});

async function fetchQuestionsData() {
    try {
        // Check if offline mode is enabled
        const isOfflineModeEnabled = window.CacheUtils && window.CacheUtils.isOfflineModeEnabled();
        
        // First try to use offline data if offline mode is enabled
        if (isOfflineModeEnabled && window.CacheUtils && window.CacheUtils.hasOfflineData()) {
            // Get questions from local storage or memory
            questionsData = window.CacheUtils.getOfflineQuestions();
            
            if (questionsData) {
                console.log("Using offline questions data");
                return;
            } else {
                console.warn("Offline mode enabled but failed to retrieve data, will try API");
            }
        }
        
        // Try to fetch from API
        try {
            const response = await fetch('https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5');
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }
            questionsData = await response.json();
            console.log("Questions data loaded successfully from API");
            
            // Cache the API data for future use (even if not in offline mode)
            if (window.CacheUtils) {
                window.CacheUtils.cacheAllQuestions(questionsData);
                
                // Save this data for potential offline use
                try {
                    const jsonString = JSON.stringify(questionsData);
                    
                    if (jsonString.length > 4 * 1024 * 1024) {
                        window.CacheUtils.storeChunkedData('satCrackOfflineQuestions', questionsData);
                    } else {
                        localStorage.setItem('satCrackOfflineQuestions', jsonString);
                    }
                    
                    localStorage.setItem('satCrackOfflineTimestamp', new Date().toISOString());
                } catch (storageError) {
                    console.warn('Storage error when caching API data:', storageError);
                    window.CacheUtils.inMemoryQuestions = questionsData;
                }
            }
        } catch (apiError) {
            console.error("Error fetching from API:", apiError);
            
            // If API fails but we're not in offline mode, try to use offline data anyway as a fallback
            if (window.CacheUtils && window.CacheUtils.hasOfflineData()) {
                console.log("API failed, falling back to offline data");
                questionsData = window.CacheUtils.getOfflineQuestions();
                if (questionsData) {
                    return;
                }
            }
            
            // As a last resort, try to load the default questions file
            if (window.CacheUtils) {
                try {
                    console.log("Trying to load default questions file");
                    await window.CacheUtils.loadDefaultQuestions();
                    questionsData = window.CacheUtils.getOfflineQuestions();
                    if (questionsData) {
                        console.log("Using default questions file due to API error");
                        return;
                    } else if (window.CacheUtils.inMemoryQuestions) {
                        // Use in-memory questions if localStorage failed
                        questionsData = window.CacheUtils.inMemoryQuestions;
                        console.log("Using in-memory questions due to storage limitations");
                        return;
                    }
                } catch (defaultError) {
                    console.error("Failed to load default questions:", defaultError);
                }
            }
            
            throw new Error('Failed to load questions from any source');
        }
    } catch (error) {
        console.error("Error fetching questions:", error);
        throw error;
    }
}

function updateTopicBadge() {
    const topicBadge = document.getElementById('topic-badge');
    if (!topicBadge) return;
    
    if (topic) {
        // Format topic name (e.g., "problem-solving" -> "Problem Solving")
        const formattedTopic = topic
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
        topicBadge.textContent = formattedTopic;
        
        // Determine section based on topic
        const mathTopics = ['algebra', 'problem-solving', 'advanced-math', 'geometry'];
        section = mathTopics.includes(topic) ? 'math' : 'english';
        
        // Add color based on section
        if (section === 'math') {
            topicBadge.classList.add('bg-blue-100', 'text-blue-800');
        } else {
            topicBadge.classList.add('bg-green-100', 'text-green-800');
        }
    } else if (mode === 'daily') {
        topicBadge.textContent = 'Daily Challenge';
        topicBadge.classList.add('bg-purple-100', 'text-purple-800');
    } else {
        topicBadge.textContent = 'Random Practice';
        topicBadge.classList.add('bg-pink-100', 'text-pink-800');
    }
}

async function loadQuestion() {
    try {
        if (currentQuestionIndex >= totalQuestions) {
            // Quiz completed
            showCompletionScreen();
            return;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${(currentQuestionIndex / totalQuestions) * 100}%`;
        }
        
        // Get a question based on topic or mode
        try {
            if (topic) {
                // Get question for specific topic
                currentQuestion = getQuestionForTopic(topic, section);
            } else if (mode === 'daily') {
                // Get daily challenge question
                currentQuestion = getDailyQuestion();
            } else {
                // Get random question
                currentQuestion = getRandomQuestion();
            }
            
            // Make sure we got a valid question
            if (!currentQuestion || !currentQuestion.question) {
                console.warn('Invalid question returned, using sample question');
                currentQuestion = getSampleQuestion();
            }
        } catch (questionError) {
            console.error('Error getting question:', questionError);
            currentQuestion = getSampleQuestion();
        }
        
        renderQuestion();
        
        // Reset hint state
        hasShownHint = false;
    } catch (error) {
        console.error('Error loading question:', error);
        currentQuestion = getSampleQuestion();
        renderQuestion();
    }
}

function getQuestionForTopic(topicName, sectionName) {
    // Validate questionsData
    if (!questionsData) {
        console.error('Questions data is null or undefined');
        throw new Error('Questions data not loaded');
    }
    
    // First, find all available sections in the data
    const availableSections = Object.keys(questionsData).filter(key => 
        Array.isArray(questionsData[key]) && questionsData[key].length > 0
    );
    
    if (availableSections.length === 0) {
        throw new Error('No valid sections found in question data');
    }
    
    console.log('Available sections:', availableSections);
    
    // Determine the proper section name based on topic
    // Some API responses use different section naming
    const mathTopics = ['algebra', 'problem-solving', 'advanced-math', 'geometry'];
    const englishTopics = ['reading', 'writing', 'grammar', 'craft'];
    
    // Override sectionName if it doesn't exist in the data
    if (!availableSections.includes(sectionName)) {
        // Try to find the right section based on topic
        if (mathTopics.includes(topicName)) {
            if (availableSections.includes('math')) {
                sectionName = 'math';
            } else {
                // Try alternate math section names
                const mathSectionAlternatives = ['mathematics', 'maths', 'math_section'];
                for (const alt of mathSectionAlternatives) {
                    if (availableSections.includes(alt)) {
                        sectionName = alt;
                        break;
                    }
                }
            }
        } else if (englishTopics.includes(topicName)) {
            if (availableSections.includes('english')) {
                sectionName = 'english';
            } else {
                // Try alternate english section names
                const englishSectionAlternatives = ['verbal', 'reading', 'english_section'];
                for (const alt of englishSectionAlternatives) {
                    if (availableSections.includes(alt)) {
                        sectionName = alt;
                        break;
                    }
                }
            }
        }
        
        // If we still don't have a valid section, use the first available one
        if (!availableSections.includes(sectionName)) {
            console.warn(`Could not find appropriate section for topic ${topicName}, using ${availableSections[0]}`);
            sectionName = availableSections[0];
        }
    }
    
    console.log(`Selected section for topic ${topicName}: ${sectionName}`);
    
    // Map topic names to official domain names
    const topicToDomain = {
        // Math domains
        'algebra': 'Algebra',
        'problem-solving': 'Problem-Solving and Data Analysis',
        'advanced-math': 'Advanced Math',
        'geometry': 'Geometry and Trigonometry',
        
        // English domains
        'reading': 'Information and Ideas',
        'writing': 'Expression of Ideas',
        'grammar': 'Standard English Conventions',
        'craft': 'Craft and Structure'
    };
    
    const domainName = topicToDomain[topicName] || topicName;
    
    // Find all questions for the topic
    const topicQuestions = questionsData[sectionName].filter(q => {
        return q.domain === domainName || 
               // Also try matching with case-insensitive comparison or partial match
               (q.domain && q.domain.toLowerCase() === domainName.toLowerCase()) || 
               (q.domain && q.domain.includes(domainName)) ||
               // Also check if domain contains the topic name (less strict matching)
               (q.domain && q.domain.toLowerCase().includes(topicName.toLowerCase()));
    });
    
    if (!topicQuestions.length) {
        console.warn(`No questions found for topic: ${topicName} (domain: ${domainName})`);
        console.log(`Falling back to random question from section: ${sectionName}`);
        
        // Return a random question from the section
        return questionsData[sectionName][Math.floor(Math.random() * questionsData[sectionName].length)];
    }
    
    // Return a random question from the topic
    return topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
}

function getDailyQuestion() {
    // Validate questionsData
    if (!questionsData) {
        console.error('Questions data is null or undefined');
        return getSampleQuestion();
    }
    
    // Find valid sections with questions
    const validSections = Object.keys(questionsData).filter(key => 
        Array.isArray(questionsData[key]) && questionsData[key].length > 0
    );
    
    if (validSections.length === 0) {
        console.error('No valid question sections found');
        return getSampleQuestion();
    }
    
    // Use the current date as a seed
    const today = new Date().toISOString().split('T')[0];
    const seed = hashStringFixed(today);
    
    // Select section based on seed
    const sectionIndex = seed % validSections.length;
    const section = validSections[sectionIndex];
    
    // Get questions for the section
    const sectionQuestions = questionsData[section];
    
    // Use the seed to pick a question
    const questionIndex = seed % sectionQuestions.length;
    
    return sectionQuestions[questionIndex];
}

function getRandomQuestion() {
    // Validate questionsData
    if (!questionsData) {
        console.error('Questions data is null or undefined');
        return getSampleQuestion();
    }
    
    // Find valid sections with questions
    const validSections = Object.keys(questionsData).filter(key => 
        Array.isArray(questionsData[key]) && questionsData[key].length > 0
    );
    
    if (validSections.length === 0) {
        console.error('No valid question sections found');
        return getSampleQuestion();
    }
    
    // Randomly select a section
    const sectionIndex = Math.floor(Math.random() * validSections.length);
    const section = validSections[sectionIndex];
    
    // Get random question from the section
    const sectionQuestions = questionsData[section];
    const questionIndex = Math.floor(Math.random() * sectionQuestions.length);
    
    return sectionQuestions[questionIndex];
}

// Fixed hash string function (the original has an infinite loop)
function hashStringFixed(str) {
    let hash = 0;
    
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
}

// Replace the broken hashString function with the fixed one
function hashString(str) {
    return hashStringFixed(str);
}

function getSampleQuestion() {
    // Sample question as fallback
    return {
        'id': 'd0d9ede4', 
        'domain': 'Problem-Solving and Data Analysis', 
        'visuals': {'type': 'image', 'svg_content': 'https://via.placeholder.com/400x200?text=Example+Math+Problem'}, 
        'question': {
            'choices': {'A': '10', 'B': '17', 'C': '31', 'D': '102'}, 
            'question': 'How many feet are equivalent to 34 yards? (1 yard = 3 feet)', 
            'paragraph': 'The yard (abbreviation: yd) is an English unit of length, in both the British imperial and US customary systems of measurement, that comprises 3 feet or 36 inches.', 
            'explanation': "It's given that 1 yard is equivalent to 3 feet. Therefore, 34 yards is equivalent to $(34 \\text{ yards}) \\times (3 \\text{ feet} / 1 \\text{ yard}) = 102 \\text{ feet}$.", 
            'correct_answer': 'D'
        }, 
        'difficulty': 'Easy'
    };
}

function renderQuestion() {
    // Safety check for missing elements
    const questionText = document.getElementById('question-text');
    if (!questionText) {
        console.error('Missing element: question-text');
        return;
    }
    
    const paragraphContainer = document.getElementById('paragraph-container');
    const paragraphText = document.getElementById('paragraph-text');
    const imageContainer = document.getElementById('image-container');
    const questionImage = document.getElementById('question-image');
    const choicesContainer = document.getElementById('choices-container');
    
    if (!paragraphContainer || !paragraphText || !imageContainer || 
        !questionImage || !choicesContainer) {
        console.error('Missing required elements for rendering the question');
        return;
    }
    
    // Reset selected answer
    selectedAnswer = null;
    const checkBtn = document.getElementById('check-btn');
    if (checkBtn) checkBtn.disabled = true;
    
    // Set question text
    questionText.textContent = currentQuestion.question.question;
    
    // Handle LaTeX in question
    if (window.KaTeXUtils) {
        KaTeXUtils.renderMath(questionText);
    } else if (typeof renderMathInElement === 'function') {
        renderMathInElement(questionText, {
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

    // Handle paragraph if present
    if (currentQuestion.question.paragraph) {
        paragraphText.textContent = currentQuestion.question.paragraph;
        paragraphContainer.classList.remove('hidden');
        
        // Handle LaTeX in paragraph
        if (window.KaTeXUtils) {
            KaTeXUtils.renderMath(paragraphText);
        } else if (typeof renderMathInElement === 'function') {
            renderMathInElement(paragraphText, {
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
    } else {
        paragraphContainer.classList.add('hidden');
    }
    
    // Handle image if present
    if (currentQuestion.visuals && 
        currentQuestion.visuals.type !== 'null' && 
        currentQuestion.visuals.svg_content !== 'null') {
        
        try {
            // Get the image URL
            let imageUrl = currentQuestion.visuals.svg_content;
            
            // Skip placeholder or invalid images
            if (!imageUrl || imageUrl.includes('placeholder') || !imageUrl.match(/^https?:\/\//)) {
                console.warn('Skipping placeholder or invalid image URL:', imageUrl);
                imageContainer.classList.add('hidden');
                return;
            }
            
            // If it's a URL, use an img tag
            questionImage.src = imageUrl;
            imageContainer.innerHTML = ''; // Clear any SVG content
            imageContainer.appendChild(questionImage);
            imageContainer.classList.remove('hidden');
            
            // Add error handling for the image
            questionImage.onerror = function() {
                console.error('Failed to load question image:', questionImage.src);
                imageContainer.classList.add('hidden');
            };
        } catch (imageError) {
            console.error('Error displaying question image:', imageError);
            imageContainer.classList.add('hidden');
        }
    } else {
        imageContainer.classList.add('hidden');
    }
    
    // Render answer choices
    renderAnswerChoices();
    
    // Hide explanation container
    const explanationContainer = document.getElementById('explanation-container');
    if (explanationContainer) {
        explanationContainer.classList.add('hidden');
    }
    
    // Start timer
    startQuestionTimer();
    
    // Use performance monitoring if available
    const renderTimer = window.PerformanceMonitor ? 
        window.PerformanceMonitor.startTimer('renderQuestion') : null;
        
    if (!currentQuestion) {
        console.error('No question to render');
        return;
    }
    
    // Update topic badge
    updateTopicBadge();
    
    // Get question container
    const questionContainer = document.getElementById('question-container');
    if (!questionContainer) return;
    
    // Update question text - use the existing questionText element
    if (questionText) {
        questionText.innerHTML = currentQuestion.question;
        questionText.classList.add('math-content');
    }
    
    // Update question image - use the existing questionImage element
    if (questionImage) {
        if (currentQuestion.image) {
            questionImage.src = currentQuestion.image;
            questionImage.classList.remove('hidden');
            
            // Apply image optimization if available
            if (window.ContentLoader) {
                window.ContentLoader.optimizeImage(questionImage, {
                    responsive: true
                });
            }
        } else {
            questionImage.classList.add('hidden');
        }
    }
    
    // Render answer choices
    renderAnswerChoices();
    
    // Show the question container
    questionContainer.classList.remove('hidden');
    
    // Apply KaTex rendering to math content with deferred loading
    if (typeof renderMathInElement === 'function') {
        // If ContentLoader is available, it will handle optimized rendering
        if (!window.ContentLoader) {
            renderMathInElement(document.body, {
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
    
    // End timer if we're monitoring performance
    if (renderTimer) {
        window.PerformanceMonitor.endTimer(renderTimer, 'render');
    }
}

function renderAnswerChoices() {
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = ''; // Clear previous choices
    
    Object.entries(currentQuestion.question.choices).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.classList.add(
            'answer-btn', 
            'w-full', 
            'py-3', 
            'px-4', 
            'rounded-lg', 
            'border-2', 
            'border-gray-200', 
            'text-left',
            'flex',
            'items-center'
        );
        
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
}

function selectAnswer(choice) {
    selectedAnswer = choice;
    
    // Update button styles
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.classList.remove('selected-answer');
        
        const choiceIndicator = btn.querySelector('span:first-child');
        if (choiceIndicator) {
            choiceIndicator.classList.remove('bg-purple-500', 'text-white', 'border-purple-500');
            choiceIndicator.classList.add('border-gray-300');
        }
    });
    
    // Style selected button
    const selectedButton = document.querySelector(`.answer-btn[data-choice="${choice}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected-answer');
        
        const choiceIndicator = selectedButton.querySelector('span:first-child');
        if (choiceIndicator) {
            choiceIndicator.classList.remove('border-gray-300');
            choiceIndicator.classList.add('bg-purple-500', 'text-white', 'border-purple-500');
        }
    }
    
    // Enable check button
    const checkBtn = document.getElementById('check-btn');
    if (checkBtn) {
        checkBtn.disabled = false;
    }
}

function checkAnswer() {
    if (!selectedAnswer || !currentQuestion) return;
    
    const correctAnswer = currentQuestion.question.correct_answer;
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Update result display
    const explanationContainer = document.getElementById('explanation-container');
    const resultIcon = document.getElementById('result-icon');
    const resultText = document.getElementById('result-text');
    
    // Show explanation container
    explanationContainer.classList.remove('hidden');
    
    // Disable all answer buttons to prevent changing answers after checking
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('pointer-events-none'); // Prevent clicking with CSS
    });
    
    // Disable check button as well
    const checkBtn = document.getElementById('check-btn');
    if (checkBtn) {
        checkBtn.disabled = true;
    }
    
    if (isCorrect) {
        // Increment correct answers
        correctAnswers++;
        
        // Style result display
        resultIcon.className = 'w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600';
        resultIcon.innerHTML = '✓';
        resultText.textContent = 'Correct!';
        resultText.className = 'text-lg font-semibold text-green-600';
        
        // Show confetti
        showConfetti();
        
        // Update user progress in localStorage
        updateUserProgress();
        
        // Update XP display immediately after gaining XP
        updateLevelDisplay();
        
        // Base XP for correct answer
        let earnedXP = 10;
        
        // Bonus XP for answering quickly (up to 2x for answering in first 25% of time)
        const timeBonus = Math.floor(remainingTime / calculateTimeForLevel(userData.level) * 10);
        earnedXP += timeBonus;
        
        // Add difficulty bonus
        if (currentQuestion.difficulty === 'hard') {
            earnedXP *= 1.5;
        } else if (currentQuestion.difficulty === 'medium') {
            earnedXP *= 1.2;
        }
        
        // Round to integer
        earnedXP = Math.floor(earnedXP);
        
        // Add to session XP
        xpGained += earnedXP;
        
        // Show XP gained
        showToast(`+${earnedXP} XP`, 'success', 1500);
        
        // Track correct answer for the domain
        trackDomainPerformance(currentQuestion.domain, true);
    } else {
        // Reduce lives
        lives--;
        updateLivesDisplay();
        
        // Style result display
        resultIcon.className = 'w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600';
        resultIcon.innerHTML = '✗';
        resultText.innerHTML = `<span class="text-red-600 font-semibold">Incorrect!</span> <span class="text-gray-700">The correct answer was <span class="font-bold">${correctAnswer}</span>.</span>`;
        
        // Add shake animation to question container
        const questionCard = document.querySelector('.question-card');
        if (questionCard) {
            questionCard.classList.add('shake');
            setTimeout(() => questionCard.classList.remove('shake'), 500);
        }
        
        // Show incorrect toast with correct answer
        showToast(`The correct answer was ${correctAnswer}: ${currentQuestion.question.choices[correctAnswer]}`, 'error', 4000);
        
        // Track incorrect answer for the domain
        trackDomainPerformance(currentQuestion.domain, false);
    }
    
    // Show explanation
    const explanationText = document.getElementById('explanation-text');
    explanationText.textContent = currentQuestion.question.explanation;
    
    // Render LaTeX in explanation
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
    
    // Color buttons based on correctness
    document.querySelectorAll('.answer-btn').forEach(btn => {
        const choice = btn.dataset.choice;
        
        if (choice === correctAnswer) {
            btn.classList.add('correct-answer');
            const choiceIndicator = btn.querySelector('span:first-child');
            if (choiceIndicator) {
                choiceIndicator.classList.remove('border-gray-300', 'bg-purple-500');
                choiceIndicator.classList.add('bg-green-500', 'text-white', 'border-green-500');
            }
        }
        
        if (choice === selectedAnswer && choice !== correctAnswer) {
            btn.classList.add('incorrect-answer');
            const choiceIndicator = btn.querySelector('span:first-child');
            if (choiceIndicator) {
                choiceIndicator.classList.remove('border-gray-300', 'bg-purple-500');
                choiceIndicator.classList.add('bg-red-500', 'text-white', 'border-red-500');
            }
        }
    });
    
    // Check if game is over due to running out of lives
    if (lives <= 0) {
        setTimeout(() => {
            alert('Game over! You ran out of lives.');
            window.location.href = 'index.html';
        }, 1500);
    }
    
    // Stop the timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Preload the next question in the background
    preloadNextQuestion();
}

// Track user performance by domain
function trackDomainPerformance(domain, isCorrect) {
    // Get user data from localStorage
    let userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    if (!userData) return;
    
    // Initialize domain performance tracking if it doesn't exist
    if (!userData.domainPerformance) {
        userData.domainPerformance = {};
    }
    
    // Initialize this domain if it doesn't exist
    if (!userData.domainPerformance[domain]) {
        userData.domainPerformance[domain] = {
            correct: 0,
            incorrect: 0,
            total: 0
        };
    }
    
    // Update the statistics
    userData.domainPerformance[domain].total++;
    
    if (isCorrect) {
        userData.domainPerformance[domain].correct++;
    } else {
        userData.domainPerformance[domain].incorrect++;
    }
    
    // Save back to localStorage
    localStorage.setItem('satCrackUserData', JSON.stringify(userData));
    
    // Load user data with performance monitoring if available
    const loadTimer = window.PerformanceMonitor ? 
        window.PerformanceMonitor.startTimer('loadUserData') : null;
        
    // Use the existing userData variable instead of redeclaring it
    userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    if (loadTimer) {
        window.PerformanceMonitor.endTimer(loadTimer, 'resource');
    }
    
    if (!userData) return;
    
    // Initialize domain performance tracking if it doesn't exist
    if (!userData.domainPerformance) {
        userData.domainPerformance = {};
    }
    
    // Initialize this domain if it doesn't exist
    if (!userData.domainPerformance[domain]) {
        userData.domainPerformance[domain] = {
            correct: 0,
            incorrect: 0,
            total: 0
        };
    }
    
    // Update the statistics
    userData.domainPerformance[domain].total++;
    
    if (isCorrect) {
        userData.domainPerformance[domain].correct++;
    } else {
        userData.domainPerformance[domain].incorrect++;
    }
    
    // Save back to localStorage with performance monitoring
    const saveTimer = window.PerformanceMonitor ? 
        window.PerformanceMonitor.startTimer('saveUserData') : null;
        
    localStorage.setItem('satCrackUserData', JSON.stringify(userData));
    
    if (saveTimer) {
        window.PerformanceMonitor.endTimer(saveTimer, 'resource');
    }
}

// Enhanced toast functionality to support different types (success, error, info)
function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm z-50 toast-message';
    
    // Set styles based on type
    switch(type) {
        case 'success':
            toast.className += ' bg-green-600 text-white';
            message = `✓ ${message}`;
            break;
        case 'error':
            toast.className += ' bg-red-600 text-white';
            message = `✗ ${message}`;
            break;
        default:
            toast.className += ' bg-gray-800 text-white';
    }
    
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Remove after specified duration
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

function showHint() {
    if (hasShownHint) return;
    
    const correctAnswer = currentQuestion.question.correct_answer;
    const choices = Object.keys(currentQuestion.question.choices);
    
    // Remove 2 incorrect answers (or 1 if there are only 2 choices total)
    const numberOfChoicesToRemove = choices.length <= 2 ? 1 : 2;
    const choicesToRemove = choices
        .filter(choice => choice !== correctAnswer)
        .sort(() => 0.5 - Math.random())
        .slice(0, numberOfChoicesToRemove);
    
    // Hide eliminated choices
    choicesToRemove.forEach(choice => {
        const button = document.querySelector(`.answer-btn[data-choice="${choice}"]`);
        if (button) {
            button.classList.add('opacity-30');
            button.disabled = true;
        }
    });
    
    // Disable the hint button
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.disabled = true;
    hintBtn.classList.add('opacity-50');
    
    hasShownHint = true;
    
    // Show hint toast
    showToast('Hint used: Some wrong answers eliminated!');
}

function loadNextQuestion() {
    // Hide explanation
    document.getElementById('explanation-container').classList.add('hidden');
    
    // Increment question counter
    currentQuestionIndex++;
    
    // Load next question
    loadQuestion();
}

function showCompletionScreen() {
    // Clear question container
    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = '';
    
    // Create completion screen
    const completionScreen = document.createElement('div');
    completionScreen.className = 'bg-white rounded-xl shadow-md p-6 text-center';
    
    // Calculate score percentage
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Generate stars based on score
    let stars = '⭐⭐⭐';
    if (scorePercentage < 60) {
        stars = '⭐';
    } else if (scorePercentage >= 60 && scorePercentage < 80) {
        stars = '⭐⭐';
    }
    
    completionScreen.innerHTML = `
        <div class="text-4xl mb-4">${stars}</div>
        <h2 class="text-2xl font-bold mb-2">Quiz Completed!</h2>
        <p class="text-gray-700 mb-4">You got ${correctAnswers} out of ${totalQuestions} questions correct.</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div class="bg-purple-600 h-2.5 rounded-full" style="width: ${scorePercentage}%"></div>
        </div>
        <div class="flex justify-center space-x-4">
            <button id="home-btn" class="px-4 py-2 bg-gray-200 rounded-lg text-gray-700">
                Return Home
            </button>
            <button id="retry-btn" class="px-4 py-2 bg-purple-600 text-white rounded-lg">
                Try Again
            </button>
        </div>
    `;
    
    questionContainer.appendChild(completionScreen);
    
    // Hide other UI elements
    document.getElementById('check-btn').style.display = 'none';
    document.getElementById('hint-btn').style.display = 'none';
    
    // Add event listeners to the new buttons
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('retry-btn').addEventListener('click', () => {
        // Reset the quiz and start over
        currentQuestionIndex = 0;
        correctAnswers = 0;
        lives = 3;
        updateLivesDisplay();
        loadQuestion();
        
        // Restore UI elements
        document.getElementById('check-btn').style.display = 'block';
        document.getElementById('hint-btn').style.display = 'flex';
    });
    
    // Show confetti for good scores
    if (scorePercentage >= 70) {
        showConfetti();
    }
}

function updateUserProgress() {
    // Get user data
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    if (!userData) return;
    
    // Update completed questions count
    userData.completedQuestions++;
    
    // Update specific topic progress if applicable
    if (topic && userData.progress[topic] !== undefined) {
        // Increment progress by a small amount
        userData.progress[topic] = Math.min(100, userData.progress[topic] + 2);
    }
    
    // Add gained XP
    userData.xp += xpGained;
    
    // Check if user leveled up
    checkLevelUp(userData);
    
    // Check achievements
    checkAchievements(userData);
    
    // Save back to localStorage
    localStorage.setItem('satCrackUserData', JSON.stringify(userData));
    
    // Update the global userData object to reflect changes
    window.userData = userData;
}

// Check if user should level up
function checkLevelUp(userData) {
    if (userData.xp >= userData.xpToNextLevel) {
        // Level up
        userData.level++;
        
        // Calculate XP for next level (increases with each level)
        userData.xpToNextLevel = calculateXpForNextLevel(userData.level);
        
        // Show level up notification
        showLevelUpNotification(userData.level);
    }
}

// Calculate XP needed for next level
function calculateXpForNextLevel(level) {
    // Formula: 100 * level * 1.5
    return Math.floor(100 * level * 1.5);
}

// Show level up notification
function showLevelUpNotification(newLevel) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-6 text-center z-50 animate-bounce';
    notification.innerHTML = `
        <div class="text-4xl mb-2">🎉</div>
        <h3 class="text-xl font-bold text-purple-700 mb-2">Level Up!</h3>
        <p class="text-gray-700">You've reached level ${newLevel}</p>
        <p class="text-sm text-gray-500 mt-1">Questions will be more challenging now</p>
    `;
    
    document.body.appendChild(notification);
    
    // Update the XP display again after level up
    updateLevelDisplay();
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Update level display
function updateLevelDisplay() {
    const levelElement = document.getElementById('user-level');
    if (!levelElement) return;
    
    // Get the latest user data
    const latestUserData = JSON.parse(localStorage.getItem('satCrackUserData')) || userData;
    
    const level = latestUserData.level || 1;
    levelElement.textContent = `Level ${level}`;
    
    // Update XP bar if it exists
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    
    if (xpBar && xpText) {
        const xpPercent = ((latestUserData.xp || 0) / (latestUserData.xpToNextLevel || 100)) * 100;
        xpBar.style.width = `${Math.min(xpPercent, 100)}%`;
        xpText.textContent = `${latestUserData.xp || 0}/${latestUserData.xpToNextLevel || 100} XP`;
    }
}

function checkAchievements(userData) {
    // Define domains by section for achievement tracking
    const domains = {
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
    
    // Check if current question's domain belongs to math
    const isMathDomain = domains.math.includes(currentQuestion.domain);
    
    // Check math master achievement
    const mathMaster = userData.achievements.find(a => a.id === 'math-master');
    if (mathMaster && isMathDomain) {
        mathMaster.progress++;
        if (mathMaster.progress >= mathMaster.total && !mathMaster.unlocked) {
            mathMaster.unlocked = true;
            showToast('Achievement Unlocked: Math Master! 🏆', 'success');
        }
    }
    
    // Check reading pro achievement
    const readingPro = userData.achievements.find(a => a.id === 'reading-pro');
    if (readingPro && !isMathDomain) {
        readingPro.progress++;
        if (readingPro.progress >= readingPro.total && !readingPro.unlocked) {
            readingPro.unlocked = true;
            showToast('Achievement Unlocked: Reading Pro! 🏆', 'success');
        }
    }
    
    // More achievements can be added here
}

function showConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0 
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
}