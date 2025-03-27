/**
 * Cache Utilities for SAT Crack
 * Handles data caching, preloading, and optimized resource loading
 */

const CacheUtils = {
    // Cache keys
    KEYS: {
        QUESTIONS: 'satCrackOfflineQuestions',
        TIMESTAMP: 'satCrackOfflineTimestamp',
        OFFLINE_MODE: 'satCrackOfflineMode',
        PRELOADED_TOPICS: 'satCrackPreloadedTopics',
        QUESTION_CACHE: 'satCrackQuestionCache'
    },
    
    // In-memory storage for when localStorage fails
    inMemoryQuestions: null,
    preloadedContent: {},
    
    // Check if offline mode is enabled
    isOfflineModeEnabled: function() {
        return localStorage.getItem(this.KEYS.OFFLINE_MODE) === 'true';
    },
    
    // Enable or disable offline mode
    setOfflineMode: function(enabled) {
        localStorage.setItem(this.KEYS.OFFLINE_MODE, enabled ? 'true' : 'false');
    },
    
    // Check if we have offline data available
    hasOfflineData: function() {
        try {
            return localStorage.getItem(this.KEYS.QUESTIONS) !== null || this.inMemoryQuestions !== null;
        } catch (e) {
            console.error('Error checking offline data:', e);
            return this.inMemoryQuestions !== null;
        }
    },
    
    // Get all cached questions
    getOfflineQuestions: function() {
        try {
            const chunkedData = this.getChunkedData(this.KEYS.QUESTIONS);
            if (chunkedData) return chunkedData;
            
            const data = localStorage.getItem(this.KEYS.QUESTIONS);
            return data ? JSON.parse(data) : this.inMemoryQuestions;
        } catch (e) {
            console.error('Error retrieving offline questions:', e);
            return this.inMemoryQuestions;
        }
    },
    
    // Store data in chunks if it's too large for localStorage
    storeChunkedData: function(key, data) {
        try {
            const jsonString = JSON.stringify(data);
            const chunkSize = 1024 * 1024; // 1MB chunks
            const chunks = Math.ceil(jsonString.length / chunkSize);
            
            // Clear any existing chunks
            for (let i = 0; i < 20; i++) { // Arbitrary limit to avoid infinite loop
                const chunkKey = `${key}_chunk_${i}`;
                if (localStorage.getItem(chunkKey) === null) break;
                localStorage.removeItem(chunkKey);
            }
            
            // Store chunk count
            localStorage.setItem(`${key}_chunks`, chunks.toString());
            
            // Store each chunk
            for (let i = 0; i < chunks; i++) {
                const chunkKey = `${key}_chunk_${i}`;
                const start = i * chunkSize;
                const end = Math.min((i + 1) * chunkSize, jsonString.length);
                localStorage.setItem(chunkKey, jsonString.substring(start, end));
            }
            
            return true;
        } catch (e) {
            console.error('Error storing chunked data:', e);
            return false;
        }
    },
    
    // Retrieve chunked data
    getChunkedData: function(key) {
        try {
            const chunksStr = localStorage.getItem(`${key}_chunks`);
            if (!chunksStr) return null;
            
            const chunks = parseInt(chunksStr);
            let jsonString = '';
            
            for (let i = 0; i < chunks; i++) {
                const chunkKey = `${key}_chunk_${i}`;
                const chunk = localStorage.getItem(chunkKey);
                if (!chunk) return null; // Missing chunk
                jsonString += chunk;
            }
            
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Error retrieving chunked data:', e);
            return null;
        }
    },
    
    // Cache all questions for offline use
    cacheAllQuestions: function(questionsData) {
        try {
            const jsonString = JSON.stringify(questionsData);
            if (jsonString.length > 4 * 1024 * 1024) {
                this.storeChunkedData(this.KEYS.QUESTIONS, questionsData);
            } else {
                localStorage.setItem(this.KEYS.QUESTIONS, jsonString);
            }
            localStorage.setItem(this.KEYS.TIMESTAMP, new Date().toISOString());
            
            // Keep a copy in memory as fallback
            this.inMemoryQuestions = questionsData;
            return true;
        } catch (e) {
            console.error('Error caching questions:', e);
            this.inMemoryQuestions = questionsData;
            return false;
        }
    },
    
    // Load default questions data
    loadDefaultQuestions: async function() {
        try {
            const response = await fetch('data/questions.json');
            if (!response.ok) throw new Error('Failed to load default questions');
            
            const data = await response.json();
            this.cacheAllQuestions(data);
            return data;
        } catch (e) {
            console.error('Error loading default questions:', e);
            throw e;
        }
    },
    
    // Get storage statistics for UI display
    getOfflineStorageStats: function() {
        try {
            let questionsData = this.getOfflineQuestions();
            let totalQuestions = 0;
            let storageUsed = '0 KB';
            
            if (questionsData) {
                // Count total questions across all sections
                Object.values(questionsData).forEach(section => {
                    Object.values(section).forEach(topicQuestions => {
                        totalQuestions += topicQuestions.length;
                    });
                });
                
                // Calculate storage used
                const dataString = JSON.stringify(questionsData);
                const bytes = new Blob([dataString]).size;
                storageUsed = this.formatBytes(bytes);
            }
            
            return { totalQuestions, storageUsed };
        } catch (e) {
            console.error('Error calculating storage stats:', e);
            return { totalQuestions: 0, storageUsed: '0 KB' };
        }
    },
    
    // Format bytes to human-readable form
    formatBytes: function(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    // Cache individual question data for faster access
    cacheQuestion: function(question, topic, section) {
        try {
            let cache = JSON.parse(localStorage.getItem(this.KEYS.QUESTION_CACHE) || '{}');
            const questionId = question.id || `${section}_${topic}_${Object.keys(cache).length}`;
            
            cache[questionId] = {
                question: question,
                topic: topic,
                section: section,
                timestamp: new Date().toISOString()
            };
            
            // Limit cache size (keep most recent 100 questions)
            const questionIds = Object.keys(cache);
            if (questionIds.length > 100) {
                const oldestIds = questionIds
                    .sort((a, b) => new Date(cache[a].timestamp) - new Date(cache[b].timestamp))
                    .slice(0, questionIds.length - 100);
                
                oldestIds.forEach(id => delete cache[id]);
            }
            
            localStorage.setItem(this.KEYS.QUESTION_CACHE, JSON.stringify(cache));
            return true;
        } catch (e) {
            console.error('Error caching question:', e);
            return false;
        }
    },
    
    // Get cached question if available
    getCachedQuestion: function(questionId) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.KEYS.QUESTION_CACHE) || '{}');
            return cache[questionId] || null;
        } catch (e) {
            console.error('Error retrieving cached question:', e);
            return null;
        }
    },
    
    // Preload questions for a specific topic
    preloadTopic: function(topicName, sectionName) {
        try {
            const questionsData = this.getOfflineQuestions();
            if (!questionsData || !questionsData[sectionName] || !questionsData[sectionName][topicName]) {
                return false;
            }
            
            // Store in memory for immediate access
            this.preloadedContent[`${sectionName}_${topicName}`] = questionsData[sectionName][topicName];
            
            // Track preloaded topics
            let preloadedTopics = JSON.parse(localStorage.getItem(this.KEYS.PRELOADED_TOPICS) || '[]');
            if (!preloadedTopics.includes(`${sectionName}_${topicName}`)) {
                preloadedTopics.push(`${sectionName}_${topicName}`);
                localStorage.setItem(this.KEYS.PRELOADED_TOPICS, JSON.stringify(preloadedTopics));
            }
            
            return true;
        } catch (e) {
            console.error('Error preloading topic:', e);
            return false;
        }
    },
    
    // Get preloaded questions for a topic
    getPreloadedTopic: function(topicName, sectionName) {
        return this.preloadedContent[`${sectionName}_${topicName}`] || null;
    },
    
    // Preload the next likely topics based on user behavior
    preloadLikelyTopics: function(userData) {
        try {
            if (!userData || !userData.recentActivity || !userData.recentActivity.length) {
                return false;
            }
            
            // Analyze recent activity to find the most commonly accessed topics
            const topicCounts = {};
            userData.recentActivity.forEach(activity => {
                if (activity.topic && activity.section) {
                    const key = `${activity.section}_${activity.topic}`;
                    topicCounts[key] = (topicCounts[key] || 0) + 1;
                }
            });
            
            // Sort topics by frequency
            const sortedTopics = Object.keys(topicCounts)
                .sort((a, b) => topicCounts[b] - topicCounts[a])
                .slice(0, 3); // Preload top 3 most used topics
            
            // Preload each topic
            sortedTopics.forEach(topicKey => {
                const [section, topic] = topicKey.split('_');
                this.preloadTopic(topic, section);
            });
            
            return true;
        } catch (e) {
            console.error('Error preloading likely topics:', e);
            return false;
        }
    },
    
    // Clear all caches (for debugging/testing)
    clearAllCaches: function() {
        try {
            // Clear chunked data
            const chunksStr = localStorage.getItem(`${this.KEYS.QUESTIONS}_chunks`);
            if (chunksStr) {
                const chunks = parseInt(chunksStr);
                for (let i = 0; i < chunks; i++) {
                    localStorage.removeItem(`${this.KEYS.QUESTIONS}_chunk_${i}`);
                }
                localStorage.removeItem(`${this.KEYS.QUESTIONS}_chunks`);
            }
            
            // Clear other cache items
            localStorage.removeItem(this.KEYS.QUESTIONS);
            localStorage.removeItem(this.KEYS.TIMESTAMP);
            localStorage.removeItem(this.KEYS.PRELOADED_TOPICS);
            localStorage.removeItem(this.KEYS.QUESTION_CACHE);
            
            // Keep offline mode setting
            
            // Clear memory caches
            this.inMemoryQuestions = null;
            this.preloadedContent = {};
            
            return true;
        } catch (e) {
            console.error('Error clearing caches:', e);
            return false;
        }
    }
};

// Make CacheUtils available globally
window.CacheUtils = CacheUtils;
