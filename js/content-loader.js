/**
 * Content Loader for SAT Crack
 * Handles lazy loading, preloading, and efficient content display
 */

const ContentLoader = {
    // Track observed elements
    observedElements: new Map(),
    
    // Initialize lazy loading with Intersection Observer
    initLazyLoading: function() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for browsers without IntersectionObserver
            this.loadAllElements();
            return;
        }
        
        // Create observer for lazy loading
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '200px', // Start loading when element is 200px from viewport
            threshold: 0.01
        });
    },
    
    // Lazy load images
    lazyLoadImage: function(imgElement) {
        if (!imgElement) return;
        
        // Add to observed elements
        this.observedElements.set(imgElement, 'image');
        
        // Start observing
        if (this.observer) {
            this.observer.observe(imgElement);
        } else {
            // Fallback if no observer
            this.loadElement(imgElement);
        }
    },
    
    // Lazy load content section
    lazyLoadSection: function(sectionElement, loadCallback) {
        if (!sectionElement) return;
        
        // Store callback for later execution
        this.observedElements.set(sectionElement, {
            type: 'section',
            callback: loadCallback
        });
        
        // Start observing
        if (this.observer) {
            this.observer.observe(sectionElement);
        } else {
            // Fallback if no observer
            this.loadElement(sectionElement);
        }
    },
    
    // Load a specific element
    loadElement: function(element) {
        const elementData = this.observedElements.get(element);
        
        if (!elementData) return;
        
        if (elementData === 'image') {
            // Handle image loading
            if (element.dataset.src) {
                element.src = element.dataset.src;
                element.removeAttribute('data-src');
                
                // Add loaded class for CSS transitions
                element.classList.add('loaded');
            }
        } else if (typeof elementData === 'object' && elementData.type === 'section') {
            // Execute section loading callback
            if (typeof elementData.callback === 'function') {
                elementData.callback(element);
            }
            
            // Add loaded class
            element.classList.add('loaded');
        }
        
        // Remove from tracked elements
        this.observedElements.delete(element);
    },
    
    // Fallback: load all tracked elements immediately
    loadAllElements: function() {
        this.observedElements.forEach((data, element) => {
            this.loadElement(element);
        });
    },
    
    // Preload critical content for the next likely user action
    preloadNextContent: function(contentType, identifier) {
        // If we have prediction data from user behavior
        const userData = JSON.parse(localStorage.getItem('satCrackUserData') || '{}');
        
        if (contentType === 'topic') {
            // Check if CacheUtils is available
            if (window.CacheUtils) {
                // Use topic to determine what section the user is likely to view next
                if (identifier.includes('Math')) {
                    // If in math section, preload other math topics
                    window.CacheUtils.preloadTopic('Algebra', 'math');
                    window.CacheUtils.preloadTopic('Problem-Solving and Data Analysis', 'math');
                } else {
                    // If in english section, preload english topics
                    window.CacheUtils.preloadTopic('Information and Ideas', 'english');
                    window.CacheUtils.preloadTopic('Expression of Ideas', 'english');
                }
            }
        } else if (contentType === 'profile') {
            // Preload profile data
            if (window.CacheUtils && userData) {
                window.CacheUtils.preloadLikelyTopics(userData);
            }
        }
    },
    
    // Optimize images - convert to webp where supported or resize as needed
    optimizeImage: function(imgElement, options = {}) {
        if (!imgElement || !imgElement.src) return;
        
        const originalSrc = imgElement.src;
        
        // Check for WebP support
        const supportsWebP = localStorage.getItem('supportsWebP');
        
        if (supportsWebP === 'true' && !originalSrc.endsWith('.webp') && options.webp !== false) {
            // Try to use WebP version if available
            const webpSrc = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            
            // Test if WebP version exists
            fetch(webpSrc, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        imgElement.src = webpSrc;
                    }
                })
                .catch(() => {
                    // WebP version doesn't exist, keep original
                });
        }
        
        // Apply lazy loading if not already
        if (!imgElement.loading && options.lazy !== false) {
            imgElement.loading = 'lazy';
        }
        
        // Add responsive behavior if requested
        if (options.responsive) {
            imgElement.classList.add('responsive-img');
        }
    },
    
    // Detect WebP support
    detectWebPSupport: function() {
        if (localStorage.getItem('supportsWebP') !== null) {
            return Promise.resolve(localStorage.getItem('supportsWebP') === 'true');
        }
        
        return new Promise(resolve => {
            const webP = new Image();
            webP.onload = function() {
                const result = (webP.height === 1);
                localStorage.setItem('supportsWebP', result.toString());
                resolve(result);
            };
            webP.onerror = function() {
                localStorage.setItem('supportsWebP', 'false');
                resolve(false);
            };
            webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vv9UAA=';
        });
    },
    
    // Apply content loading optimizations to the current page
    optimizeCurrentPage: function() {
        // Initialize lazy loading
        this.initLazyLoading();
        
        // Detect WebP support
        this.detectWebPSupport();
        
        // Convert regular images to lazy-loaded
        document.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
            if (img.src) {
                // Store original src in data attribute
                img.dataset.src = img.src;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                this.lazyLoadImage(img);
            }
        });
        
        // Track content sections for lazy loading
        document.querySelectorAll('.content-section:not(.loaded)').forEach(section => {
            this.lazyLoadSection(section, (element) => {
                // This callback will execute when section is visible
                element.querySelectorAll('.lazy-content').forEach(content => {
                    content.classList.remove('lazy-content');
                });
            });
        });
        
        // Optimize KaTeX rendering by delaying it until visible
        if (typeof renderMathInElement === 'function') {
            document.querySelectorAll('.math-content:not(.loaded)').forEach(mathElement => {
                this.lazyLoadSection(mathElement, (element) => {
                    // Render math when element is visible
                    renderMathInElement(element, {
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
                });
            });
        }
    }
};

// Make ContentLoader available globally
window.ContentLoader = ContentLoader;
