/**
 * KaTeX utility functions for SAT Crack
 * Provides enhanced LaTeX rendering with support for various delimiters
 */

// Initialize the KaTeX utilities
const KaTeXUtils = {
    /**
     * Standard rendering configuration with support for multiple delimiters
     */
    renderConfig: {
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
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
        throwOnError: false
    },
    
    /**
     * Render math expressions in an element with enhanced support for various delimiters
     * @param {Element} element - DOM element in which to render math
     */
    renderMath: function(element) {
        if (!element || typeof renderMathInElement !== 'function') return;
        renderMathInElement(element, this.renderConfig);
    },
    
    /**
     * Special handling for LaTeX that might be surrounded by unexpected delimiters
     * @param {string} text - Text potentially containing LaTeX
     * @returns {string} - Processed text with standard LaTeX delimiters
     */
    normalizeLatex: function(text) {
        if (!text) return text;
        
        // Replace *...* with $...$
        text = text.replace(/\*(.*?)\*/g, '$$$1$$');
        
        // Replace /.../ with $...$ when not preceded by a backslash
        text = text.replace(/(?<!\\\s|\\)\/([^\/]+)\/(?!\w)/g, '$$$1$$');
        
        // Add $ around standalone expressions starting with \ that aren't already in delimiters
        text = text.replace(/(?<!\$|\\)\\([a-zA-Z]+)(\{[^}]*\}|\s+[a-zA-Z0-9]+)(?!\$)/g, '$\\$1$2$');
        
        return text;
    },
    
    /**
     * Process text content and render with LaTeX support
     * @param {Element} element - DOM element to process
     * @param {string} content - Text content with LaTeX
     */
    processAndRender: function(element, content) {
        if (!element) return;
        
        // Normalize LaTeX in content
        const normalizedContent = this.normalizeLatex(content);
        
        // Set content and render
        element.textContent = normalizedContent;
        this.renderMath(element);
    },
    
    /**
     * Initialize by attaching to global window object
     */
    init: function() {
        if (typeof window !== 'undefined') {
            window.KaTeXUtils = this;
        }
    }
};

// Initialize
KaTeXUtils.init();
