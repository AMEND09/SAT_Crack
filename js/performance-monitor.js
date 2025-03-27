/**
 * Performance Monitoring Utilities for SAT Crack
 * Monitors and optimizes app performance
 */

const PerformanceMonitor = {
    metrics: {
        pageLoads: {},
        renderTimes: [],
        apiCalls: [],
        resourceLoads: []
    },
    
    // Start timing an operation
    startTimer: function(operationName) {
        const timerId = `${operationName}_${Date.now()}`;
        performance.mark(`start_${timerId}`);
        return timerId;
    },
    
    // End timing and record metric
    endTimer: function(timerId, category = 'general') {
        const startMark = `start_${timerId}`;
        const endMark = `end_${timerId}`;
        
        try {
            performance.mark(endMark);
            performance.measure(timerId, startMark, endMark);
            
            const measurement = performance.getEntriesByName(timerId)[0];
            const duration = measurement.duration;
            
            // Store in appropriate category
            if (category === 'pageLoad') {
                const page = timerId.split('_')[0];
                this.metrics.pageLoads[page] = duration;
            } else if (category === 'render') {
                this.metrics.renderTimes.push({
                    operation: timerId,
                    duration: duration,
                    timestamp: Date.now()
                });
                
                // Keep only the last 100 render metrics
                if (this.metrics.renderTimes.length > 100) {
                    this.metrics.renderTimes.shift();
                }
            } else if (category === 'api') {
                this.metrics.apiCalls.push({
                    operation: timerId,
                    duration: duration,
                    timestamp: Date.now()
                });
                
                // Keep only the last 50 API call metrics
                if (this.metrics.apiCalls.length > 50) {
                    this.metrics.apiCalls.shift();
                }
            } else if (category === 'resource') {
                this.metrics.resourceLoads.push({
                    resource: timerId,
                    duration: duration,
                    timestamp: Date.now()
                });
                
                // Keep only the last 50 resource load metrics
                if (this.metrics.resourceLoads.length > 50) {
                    this.metrics.resourceLoads.shift();
                }
            }
            
            // Clean up marks and measures
            performance.clearMarks(startMark);
            performance.clearMarks(endMark);
            performance.clearMeasures(timerId);
            
            return duration;
        } catch (e) {
            console.error('Error measuring performance:', e);
            return null;
        }
    },
    
    // Record page load time
    recordPageLoad: function(pageName) {
        const timerId = this.startTimer(pageName);
        
        // Record when page is fully loaded
        window.addEventListener('load', () => {
            this.endTimer(timerId, 'pageLoad');
        });
        
        // Set up monitoring for resources
        this.monitorResourceLoading();
    },
    
    // Monitor resource loading performance
    monitorResourceLoading: function() {
        if (window.performance && performance.getEntriesByType) {
            // Wait for page to finish loading
            window.addEventListener('load', () => {
                // Get all resource entries
                const resources = performance.getEntriesByType('resource');
                
                // Process each resource
                resources.forEach(resource => {
                    // Only track certain resource types
                    if (['script', 'css', 'fetch', 'xmlhttprequest'].includes(resource.initiatorType)) {
                        this.metrics.resourceLoads.push({
                            resource: resource.name.split('/').pop(), // Just the filename
                            duration: resource.duration,
                            size: resource.encodedBodySize || 0,
                            timestamp: Date.now()
                        });
                    }
                });
                
                // Keep only the last 100 resource metrics
                if (this.metrics.resourceLoads.length > 100) {
                    this.metrics.resourceLoads = this.metrics.resourceLoads.slice(-100);
                }
                
                // Clear the resource timing buffer to avoid memory growth
                performance.clearResourceTimings();
            });
        }
    },
    
    // Record render time for a specific component
    recordRenderTime: function(componentName, callback) {
        const timerId = this.startTimer(componentName);
        
        // Execute the render operation
        callback();
        
        // Record the completion time
        return this.endTimer(timerId, 'render');
    },
    
    // Record API call time
    recordApiCall: function(apiName, apiCall) {
        const timerId = this.startTimer(apiName);
        
        return apiCall()
            .then(result => {
                this.endTimer(timerId, 'api');
                return result;
            })
            .catch(error => {
                this.endTimer(timerId, 'api');
                throw error;
            });
    },
    
    // Get average render time for a component
    getAverageRenderTime: function(componentName) {
        const relevantMetrics = this.metrics.renderTimes
            .filter(metric => metric.operation.startsWith(componentName));
        
        if (relevantMetrics.length === 0) return null;
        
        const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
        return total / relevantMetrics.length;
    },
    
    // Get average API call time
    getAverageApiTime: function(apiName) {
        const relevantMetrics = this.metrics.apiCalls
            .filter(metric => metric.operation.startsWith(apiName));
        
        if (relevantMetrics.length === 0) return null;
        
        const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
        return total / relevantMetrics.length;
    },
    
    // Get page performance metrics
    getPagePerformanceMetrics: function() {
        if (!window.performance || !performance.timing) {
            return null;
        }
        
        const timing = performance.timing;
        
        return {
            totalPageLoad: timing.loadEventEnd - timing.navigationStart,
            domLoading: timing.domLoading - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            resourceLoad: timing.loadEventStart - timing.domContentLoadedEventEnd
        };
    },
    
    // Analyze performance and suggest optimizations
    analyzePerformance: function() {
        const pageMetrics = this.getPagePerformanceMetrics();
        const suggestions = [];
        
        if (!pageMetrics) return suggestions;
        
        // Check total page load time
        if (pageMetrics.totalPageLoad > 3000) {
            suggestions.push('Consider optimizing page load time (currently ' + 
                Math.round(pageMetrics.totalPageLoad) + 'ms)');
        }
        
        // Check resource loading time
        if (pageMetrics.resourceLoad > 2000) {
            suggestions.push('Resource loading is slow (' + 
                Math.round(pageMetrics.resourceLoad) + 'ms). Consider lazy loading non-critical resources.');
        }
        
        // Analyze slow resources
        const slowResources = this.metrics.resourceLoads
            .filter(resource => resource.duration > 500)
            .map(resource => resource.resource);
        
        if (slowResources.length > 0) {
            const uniqueSlowResources = [...new Set(slowResources)];
            suggestions.push('Slow resources detected: ' + uniqueSlowResources.join(', '));
        }
        
        // Check API call performance
        const slowApiCalls = this.metrics.apiCalls
            .filter(api => api.duration > 1000)
            .map(api => api.operation.split('_')[0]);
        
        if (slowApiCalls.length > 0) {
            const uniqueSlowApis = [...new Set(slowApiCalls)];
            suggestions.push('Slow API calls detected: ' + uniqueSlowApis.join(', '));
        }
        
        return suggestions;
    }
};

// Make PerformanceMonitor available globally
window.PerformanceMonitor = PerformanceMonitor;
