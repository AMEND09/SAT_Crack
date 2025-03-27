/**
 * Tab Manager for SAT Crack
 * Handles optimized tab switching with preloading and caching
 */

const TabManager = {
    // Track tab states
    currentTab: '',
    previousTab: '',
    cachedTabs: {},
    loadedScripts: {},
    tabLoadTimes: {},
    
    // Initialize tab manager
    init: function() {
        // Detect current page/tab
        this.currentTab = this.getCurrentTabName();
        console.log('Tab Manager initialized on tab:', this.currentTab);
        
        // Apply tab-specific optimizations
        this.optimizeCurrentTab();
        
        // Preload likely next tabs
        this.preloadLikelyTabs();
        
        // Set up navigation listeners
        this.setupNavigationListeners();
    },
    
    // Get current tab name from URL
    getCurrentTabName: function() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index.html';
        return pageName.replace('.html', '');
    },
    
    // Apply tab-specific optimizations
    optimizeCurrentTab: function() {
        const startTime = performance.now();
        
        switch(this.currentTab) {
            case 'index':
                // Home page optimizations
                if (window.CacheUtils) {
                    window.CacheUtils.preloadTopic('Algebra', 'math');
                    window.CacheUtils.preloadTopic('Information and Ideas', 'english');
                }
                break;
                
            case 'practice':
                // Practice page optimizations
                this.ensureScriptLoaded('js/katex.min.js');
                this.ensureScriptLoaded('js/auto-render.min.js');
                
                // Preload first question
                const urlParams = new URLSearchParams(window.location.search);
                const topic = urlParams.get('topic');
                if (topic && window.CacheUtils) {
                    window.CacheUtils.preloadTopic(topic, 
                        ['algebra', 'problem-solving', 'advanced-math', 'geometry'].includes(topic) ? 'math' : 'english');
                }
                break;
                
            case 'topics':
                // Topics page optimizations
                const sectionParam = new URLSearchParams(window.location.search).get('section');
                if (sectionParam && window.CacheUtils) {
                    // Preload topics for this section
                    if (sectionParam === 'math') {
                        window.CacheUtils.preloadTopic('Algebra', 'math');
                        window.CacheUtils.preloadTopic('Problem-Solving and Data Analysis', 'math');
                    } else {
                        window.CacheUtils.preloadTopic('Information and Ideas', 'english');
                        window.CacheUtils.preloadTopic('Expression of Ideas', 'english');
                    }
                }
                break;
                
            case 'profile':
                // Profile page optimizations
                this.ensureScriptLoaded('js/chart.min.js');
                break;
        }
        
        const endTime = performance.now();
        this.tabLoadTimes[this.currentTab] = endTime - startTime;
        
        console.log(`Tab ${this.currentTab} optimized in ${endTime - startTime}ms`);
    },
    
    // Preload likely next tabs based on current tab
    preloadLikelyTabs: function() {
        // Define likely next tabs for each current tab
        const likelyNextTabs = {
            'index': ['topics', 'practice', 'profile'],
            'topics': ['practice', 'index'],
            'practice': ['topics', 'index'],
            'profile': ['index', 'topics']
        };
        
        const currentTabLikelyNexts = likelyNextTabs[this.currentTab] || [];
        
        // Preload each likely next tab
        currentTabLikelyNexts.forEach(tabName => {
            // Create link for prefetching
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = `${tabName}.html`;
            link.as = 'document';
            document.head.appendChild(link);
            
            console.log(`Prefetching ${tabName}.html for faster navigation`);
        });
    },
    
    // Set up navigation listeners for all bottom tabs
    setupNavigationListeners: function() {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Don't handle if it's the current tab
                if (link.href.includes(this.currentTab)) {
                    return;
                }
                
                // Capture the target tab
                const href = link.getAttribute('href');
                const targetTab = href.replace('.html', '');
                
                // Only intervene if we're navigating between main tabs
                const mainTabs = ['index', 'topics', 'practice', 'profile'];
                if (mainTabs.includes(targetTab)) {
                    e.preventDefault();
                    
                    // Show loading overlay
                    if (window.Loaders) {
                        Loaders.showLoading('Loading', `Switching to ${targetTab}`);
                    }
                    
                    // Store old tab for animation
                    this.previousTab = this.currentTab;
                    
                    // Cache current tab's content if not already cached
                    if (!this.cachedTabs[this.currentTab]) {
                        this.cachedTabs[this.currentTab] = document.querySelector('main').innerHTML;
                        console.log(`Cached content for ${this.currentTab}`);
                    }
                    
                    // Navigate to the new tab
                    setTimeout(() => {
                        window.location.href = href;
                    }, 50);
                }
            });
        });
    },
    
    // Load content from cache if available
    loadFromCache: function(tabName) {
        if (this.cachedTabs[tabName]) {
            document.querySelector('main').innerHTML = this.cachedTabs[tabName];
            console.log(`Loaded ${tabName} from cache`);
            return true;
        }
        return false;
    },
    
    // Ensure a script is loaded, load it if not already loaded
    ensureScriptLoaded: function(scriptSrc) {
        if (this.loadedScripts[scriptSrc]) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptSrc;
            script.async = true;
            
            script.onload = () => {
                this.loadedScripts[scriptSrc] = true;
                console.log(`Loaded script: ${scriptSrc}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`Error loading script ${scriptSrc}:`, error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    },
    
    // Get performance metrics for tab switching
    getTabSwitchMetrics: function() {
        return {
            tabLoadTimes: this.tabLoadTimes,
            cachedTabs: Object.keys(this.cachedTabs),
            loadedScripts: Object.keys(this.loadedScripts)
        };
    }
};

// Initialize TabManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab manager
    TabManager.init();
    
    // Make TabManager available globally
    window.TabManager = TabManager;
});
