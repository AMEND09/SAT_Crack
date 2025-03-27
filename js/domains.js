/**
 * Domain definitions and mappings for OpenSAT app
 * This centralizes all domain-related constants to ensure consistency across the app
 */

// Domain definitions by section
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

// Map official domain names to progress tracking keys
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

// Map progress keys to display names (for UI)
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

// Map frontend topics to section names
const TOPIC_TO_SECTION = {
    'algebra': 'math',
    'problem-solving': 'math',
    'advanced-math': 'math',
    'geometry': 'math',
    'reading': 'english',
    'craft': 'english',
    'writing': 'english',
    'grammar': 'english'
};

// Function to get section from domain
function getSectionFromDomain(domain) {
    return OPENSAT_DOMAINS.math.includes(domain) ? 'math' : 'english';
}

// Export all constants and functions
window.OpenSATDomains = {
    DOMAINS: OPENSAT_DOMAINS,
    DOMAIN_TO_PROGRESS_KEY,
    PROGRESS_KEY_TO_DISPLAY,
    TOPIC_TO_SECTION,
    getSectionFromDomain
};
