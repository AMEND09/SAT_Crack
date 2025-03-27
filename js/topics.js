// Topics page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters to see which section to display
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    if (section) {
        showSection(section);
    } else {
        // Default to show math
        showSection('math');
    }
    
    // Load user progress data
    loadUserProgress();
    
    // Setup navigation between sections
    setupNavigation();
});

function showSection(section) {
    const mathTopics = document.getElementById('math-topics');
    const englishTopics = document.getElementById('english-topics');
    const sectionTitle = document.getElementById('section-title');
    
    if (section === 'math') {
        mathTopics.classList.remove('hidden');
        englishTopics.classList.add('hidden');
        sectionTitle.textContent = 'Math Topics';
    } else if (section === 'english') {
        mathTopics.classList.add('hidden');
        englishTopics.classList.remove('hidden');
        sectionTitle.textContent = 'English Topics';
    }
}

function setupNavigation() {
    // Add section tabs for easy navigation
    const sectionTabs = document.getElementById('section-tabs');
    if (sectionTabs) {
        sectionTabs.addEventListener('click', function(e) {
            if (e.target.dataset.section) {
                showSection(e.target.dataset.section);
                
                // Update active tab
                document.querySelectorAll('#section-tabs button').forEach(tab => {
                    tab.classList.remove('bg-purple-100', 'text-purple-800', 'font-medium');
                    tab.classList.add('bg-gray-100', 'text-gray-600');
                });
                
                e.target.classList.remove('bg-gray-100', 'text-gray-600');
                e.target.classList.add('bg-purple-100', 'text-purple-800', 'font-medium');
                
                // Update URL without reloading the page
                const url = new URL(window.location);
                url.searchParams.set('section', e.target.dataset.section);
                history.replaceState({}, '', url);
            }
        });
    }
}

function loadUserProgress() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
    
    if (!userData || !userData.progress) {
        console.error('User progress data not found');
        return;
    }
    
    // Domain to frontend topic mappings
    const domainMappings = {
        // Math topics
        'algebra': 'algebra',
        'problem-solving': 'problem-solving',
        'advanced-math': 'advanced-math',
        'geometry': 'geometry',
        
        // English topics
        'reading': 'reading', // "Information and Ideas"
        'craft': 'craft',     // "Craft and Structure"
        'writing': 'writing', // "Expression of Ideas"
        'grammar': 'grammar'  // "Standard English Conventions"
    };
    
    // Update progress bars for all topics
    Object.entries(domainMappings).forEach(([progressKey, topicId]) => {
        if (userData.progress[progressKey] !== undefined) {
            updateTopicProgress(topicId, userData.progress[progressKey]);
        }
    });
}

function updateTopicProgress(topicId, progressValue) {
    // Find the link element with href containing the topic
    const topicLinks = document.querySelectorAll(`a[href*="topic=${topicId}"]`);
    
    topicLinks.forEach(topicLink => {
        // Find the progress bar and text
        const progressBar = topicLink.querySelector('.bg-gray-200 .h-full');
        const progressText = topicLink.querySelector('.flex.justify-between span:first-of-type');
        
        if (progressBar) {
            progressBar.style.width = `${progressValue}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progressValue}% complete`;
        }
    });
}
