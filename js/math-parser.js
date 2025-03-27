/**
 * Math Parser for SAT Crack
 * Converts plain text math to LaTeX for proper rendering
 */

const MathParser = {
    /**
     * Convert text with simple math expressions to proper LaTeX
     * @param {string} text - Text containing simple math expressions
     * @returns {string} - Text with LaTeX-formatted math expressions
     */
    parseText: function(text) {
        if (!text) return text;
        
        // First check if we need to process this text
        if (!this.containsMathExpressions(text)) {
            return text;
        }
        
        let result = text;
        
        // Handle variables/functions emphasized with asterisks
        // Example: *f*(x) = x^2 + 1
        result = result.replace(/\*([a-zA-Z0-9]+)\*(?:\(([^)]*)\))?/g, (match, p1, p2) => {
            if (p2) {
                return `$${p1}(${p2})$`;
            }
            return `$${p1}$`;
        });
        
        // Handle math expressions wrapped in slashes
        // Example: /x^2 + 3x/
        result = result.replace(/\/([^\/]+)\//g, '$$$1$$');
        
        // Handle exponents
        // Example: x^2 -> x^{2}
        result = result.replace(/([a-zA-Z0-9])(\^)([0-9]+)(?!\{)/g, '$1^{$3}');
        
        // Handle fractions expressed as a/b
        // Example: 3/4 -> \frac{3}{4}
        result = result.replace(/(\d+)\/(\d+)(?!\d)/g, '\\frac{$1}{$2}');
        
        // Handle square roots
        // Example: sqrt(x) -> \sqrt{x}
        result = result.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        
        // Handle subscripts
        // Example: x_1 -> x_{1}
        result = result.replace(/([a-zA-Z])_(\d+)(?!\{)/g, '$1_{$2}');
        
        return result;
    },
    
    /**
     * Check if text contains likely math expressions
     * @param {string} text - Text to check
     * @returns {boolean} - True if the text likely contains math expressions
     */
    containsMathExpressions: function(text) {
        const mathPatterns = [
            /\*[a-zA-Z0-9]+\*/,        // *f*
            /\/[^\/]+\//,               // /x^2 + 3x/
            /\^[0-9]+/,                 // x^2
            /\b[a-zA-Z]\([^)]+\)/,      // f(x)
            /\d+\/\d+/,                 // 3/4
            /sqrt\([^)]+\)/,            // sqrt(x)
            /[a-zA-Z]_\d+/,             // x_1
            /\\[a-zA-Z]+\{/             // \sqrt{x}
        ];
        
        return mathPatterns.some(pattern => pattern.test(text));
    },
    
    /**
     * Process an element's text content to convert math expressions to LaTeX
     * @param {Element} element - DOM element to process
     */
    processElement: function(element) {
        if (!element) return;
        
        // Process text nodes
        const textNodes = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        textNodes.forEach(node => {
            node.textContent = this.parseText(node.textContent);
        });
    }
};

// Make MathParser available globally
window.MathParser = MathParser;
