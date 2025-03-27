/**
 * SAT Score Predictor
 * Provides algorithms to predict SAT scores based on performance in practice questions
 */

const ScorePredictor = {
    // SAT test domains
    domains: {
        math: [
            'Algebra',
            'Problem-Solving and Data Analysis',
            'Advanced Math',
            'Geometry and Trigonometry'
        ],
        english: [
            'Information and Ideas',
            'Craft and Structure',
            'Expression of Ideas',
            'Standard English Conventions'
        ]
    },
    
    // Domain weights for score calculation
    domainWeights: {
        'Algebra': 0.3,
        'Problem-Solving and Data Analysis': 0.3,
        'Advanced Math': 0.2,
        'Geometry and Trigonometry': 0.2,
        'Information and Ideas': 0.25,
        'Craft and Structure': 0.25,
        'Expression of Ideas': 0.25,
        'Standard English Conventions': 0.25
    },
    
    // Get user's domain performance data
    getDomainPerformance: function() {
        const userData = JSON.parse(localStorage.getItem('satCrackUserData'));
        if (!userData || !userData.domainPerformance) {
            return null;
        }
        
        return userData.domainPerformance;
    },
    
    // Calculate accuracy percentage for a domain
    getDomainAccuracy: function(domainName) {
        const performance = this.getDomainPerformance();
        if (!performance || !performance[domainName]) {
            return 0;
        }
        
        const domain = performance[domainName];
        if (domain.total === 0) {
            return 0;
        }
        
        return (domain.correct / domain.total) * 100;
    },
    
    // Calculate section score (Math or English) - scores range from 200-800
    calculateSectionScore: function(section) {
        const performance = this.getDomainPerformance();
        if (!performance) {
            return { score: 200, confidence: 'low' };
        }
        
        let totalWeight = 0;
        let weightedAccuracy = 0;
        let questionsAnswered = 0;
        
        // Calculate weighted accuracy for the section
        this.domains[section].forEach(domain => {
            if (performance[domain]) {
                const domainData = performance[domain];
                const weight = this.domainWeights[domain] || 0.25;
                
                if (domainData.total > 0) {
                    const accuracy = domainData.correct / domainData.total;
                    weightedAccuracy += accuracy * weight;
                    totalWeight += weight;
                    questionsAnswered += domainData.total;
                }
            }
        });
        
        // If no questions answered in this section
        if (totalWeight === 0) {
            return { score: 200, confidence: 'none' };
        }
        
        // Normalize weighted accuracy
        const normalizedAccuracy = weightedAccuracy / totalWeight;
        
        // Convert accuracy to SAT score (200-800 scale)
        // This is a simplified algorithm - real SAT scoring is more complex
        const rawScore = 200 + Math.round(normalizedAccuracy * 600);
        
        // Determine confidence level based on questions answered
        let confidence = 'low';
        if (questionsAnswered >= 50) {
            confidence = 'high';
        } else if (questionsAnswered >= 20) {
            confidence = 'medium';
        }
        
        return { score: rawScore, confidence: confidence };
    },
    
    // Calculate total SAT score (400-1600)
    calculateTotalScore: function() {
        const mathScore = this.calculateSectionScore('math');
        const englishScore = this.calculateSectionScore('english');
        
        const totalScore = mathScore.score + englishScore.score;
        
        // Overall confidence is the lower of the two section confidences
        let confidence = 'low';
        if (mathScore.confidence === 'high' && englishScore.confidence === 'high') {
            confidence = 'high';
        } else if (mathScore.confidence !== 'none' && englishScore.confidence !== 'none') {
            confidence = 'medium';
        } else if (mathScore.confidence === 'none' && englishScore.confidence === 'none') {
            confidence = 'none';
        }
        
        return {
            total: totalScore,
            math: mathScore.score,
            english: englishScore.score,
            confidence: confidence
        };
    },
    
    // Get detailed domain breakdown
    getDomainBreakdown: function() {
        const breakdown = {};
        const performance = this.getDomainPerformance();
        
        if (!performance) {
            return {};
        }
        
        // Process math domains
        breakdown.math = {
            domains: {}
        };
        
        this.domains.math.forEach(domain => {
            if (performance[domain]) {
                const accuracy = (performance[domain].correct / performance[domain].total) * 100 || 0;
                breakdown.math.domains[domain] = {
                    accuracy: Math.round(accuracy),
                    correct: performance[domain].correct,
                    total: performance[domain].total
                };
            } else {
                breakdown.math.domains[domain] = {
                    accuracy: 0,
                    correct: 0,
                    total: 0
                };
            }
        });
        
        // Process english domains
        breakdown.english = {
            domains: {}
        };
        
        this.domains.english.forEach(domain => {
            if (performance[domain]) {
                const accuracy = (performance[domain].correct / performance[domain].total) * 100 || 0;
                breakdown.english.domains[domain] = {
                    accuracy: Math.round(accuracy),
                    correct: performance[domain].correct,
                    total: performance[domain].total
                };
            } else {
                breakdown.english.domains[domain] = {
                    accuracy: 0,
                    correct: 0,
                    total: 0
                };
            }
        });
        
        return breakdown;
    },
    
    // Get improvement recommendations based on performance
    getRecommendations: function() {
        const breakdown = this.getDomainBreakdown();
        const recommendations = [];
        
        // Find weakest domains (lowest accuracy with at least 5 questions answered)
        const weakDomains = [];
        
        // Check math domains
        for (const domain in breakdown.math.domains) {
            const data = breakdown.math.domains[domain];
            if (data.total >= 5) {
                weakDomains.push({
                    name: domain,
                    section: 'math',
                    accuracy: data.accuracy
                });
            }
        }
        
        // Check english domains
        for (const domain in breakdown.english.domains) {
            const data = breakdown.english.domains[domain];
            if (data.total >= 5) {
                weakDomains.push({
                    name: domain,
                    section: 'english',
                    accuracy: data.accuracy
                });
            }
        }
        
        // Sort by accuracy (ascending)
        weakDomains.sort((a, b) => a.accuracy - b.accuracy);
        
        // Generate recommendations for the weakest domains
        weakDomains.slice(0, 2).forEach(domain => {
            if (domain.accuracy < 70) {
                let topicUrl = '';
                
                // Map domains to topic URLs
                const domainToTopic = {
                    'Algebra': 'algebra',
                    'Problem-Solving and Data Analysis': 'problem-solving',
                    'Advanced Math': 'advanced-math',
                    'Geometry and Trigonometry': 'geometry',
                    'Information and Ideas': 'reading',
                    'Craft and Structure': 'craft',
                    'Expression of Ideas': 'writing',
                    'Standard English Conventions': 'grammar'
                };
                
                if (domainToTopic[domain.name]) {
                    topicUrl = `practice.html?topic=${domainToTopic[domain.name]}`;
                }
                
                recommendations.push({
                    domain: domain.name,
                    message: `Focus on improving your ${domain.name} skills (${domain.accuracy}% accuracy)`,
                    url: topicUrl
                });
            }
        });
        
        // If no specific recommendations, give general advice
        if (recommendations.length === 0) {
            recommendations.push({
                domain: 'General',
                message: 'Continue practicing across all domains to improve your score',
                url: 'practice.html?mode=random'
            });
        }
        
        return recommendations;
    }
};

// Make ScorePredictor available globally
window.ScorePredictor = ScorePredictor;
