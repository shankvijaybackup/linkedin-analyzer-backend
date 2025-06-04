// backend/services/redditService.js
class RedditService {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.userAgent = 'LinkedInAnalyzer/1.0';
  }

  async getRedditIntent(jobTitle) {
    try {
      console.log(`🧠 Analyzing Reddit intent signals for: ${jobTitle}`);
      
      // For demo purposes, return structured intent data
      const intentSignals = this.mockRedditAnalysis(jobTitle);
      
      return {
        jobTitle,
        signals: intentSignals.totalSignals,
        painPoints: intentSignals.painPoints,
        discussions: intentSignals.discussions,
        sentiment: intentSignals.sentiment,
        keywords: intentSignals.keywords,
        analysisDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Reddit intent analysis failed:', error.message);
      return {
        jobTitle,
        signals: 0,
        painPoints: [],
        discussions: [],
        sentiment: 'neutral',
        keywords: [],
        error: 'Analysis unavailable'
      };
    }
  }

  mockRedditAnalysis(jobTitle) {
    const titleLower = jobTitle.toLowerCase();
    
    let painPoints = [];
    let discussions = [];
    let sentiment = 'neutral';
    let keywords = [];
    let totalSignals = 0;

    // IT Leadership roles
    if (titleLower.includes('cio') || titleLower.includes('cto') || titleLower.includes('vp')) {
      painPoints = [
        'Digital transformation pressure with limited budgets',
        'Legacy system modernization challenges',
        'Scaling IT operations with lean teams',
        'Employee experience expectations vs IT capability gaps'
      ];
      
      discussions = [
        { subreddit: 'sysadmin', title: 'ServiceNow vs alternatives for mid-size companies', score: 156 },
        { subreddit: 'ITManagers', title: 'Struggling with ticket volume and team burnout', score: 89 },
        { subreddit: 'devops', title: 'Best practices for IT service automation', score: 134 }
      ];
      
      sentiment = 'frustrated';
      keywords = ['automation', 'efficiency', 'modernization', 'AI', 'self-service'];
      totalSignals = 8;
    }
    
    // IT Management roles
    else if (titleLower.includes('manager') || titleLower.includes('director')) {
      painPoints = [
        'Overwhelming ticket volumes with limited resources',
        'Manual processes eating up team productivity', 
        'Lack of visibility into service delivery metrics',
        'Integration challenges between multiple tools'
      ];
      
      discussions = [
        { subreddit: 'sysadmin', title: 'How to reduce L1 ticket volume?', score: 203 },
        { subreddit: 'ITManagers', title: 'Team spending too much time on repetitive tasks', score: 167 },
        { subreddit: 'ITSM', title: 'ServiceNow alternatives for smaller teams', score: 95 }
      ];
      
      sentiment = 'seeking_solutions';
      keywords = ['automation', 'efficiency', 'ticketing', 'workflow', 'integration'];
      totalSignals = 6;
    }
    
    // Technical roles
    else if (titleLower.includes('admin') || titleLower.includes('engineer') || titleLower.includes('analyst')) {
      painPoints = [
        'Repetitive manual tasks consuming daily work',
        'Context switching between multiple tools',
        'Lack of automation in incident response',
        'Time spent on L1 issues instead of strategic work'
      ];
      
      discussions = [
        { subreddit: 'sysadmin', title: 'Automating repetitive IT tasks', score: 278 },
        { subreddit: 'devops', title: 'Best tools for incident management automation', score: 145 },
        { subreddit: 'ITCareerQuestions', title: 'How to move beyond ticket monkey role', score: 189 }
      ];
      
      sentiment = 'solution_seeking';
      keywords = ['automation', 'scripting', 'tools', 'efficiency', 'career_growth'];
      totalSignals = 5;
    }
    
    // Default for other roles
    else {
      painPoints = [
        'IT service delivery inefficiencies',
        'Need for better automation and self-service',
        'Integration and workflow optimization'
      ];
      
      discussions = [
        { subreddit: 'technology', title: 'Enterprise software automation trends', score: 112 }
      ];
      
      sentiment = 'neutral';
      keywords = ['technology', 'automation', 'enterprise'];
      totalSignals = 2;
    }

    return {
      totalSignals,
      painPoints,
      discussions,
      sentiment,
      keywords
    };
  }

  categorizeIntent(signals) {
    if (signals >= 8) return 'high_intent';
    if (signals >= 5) return 'medium_intent';
    if (signals >= 2) return 'low_intent';
    return 'minimal_intent';
  }

  extractKeyInsights(redditData) {
    const insights = [];
    
    if (redditData.sentiment === 'frustrated') {
      insights.push('High frustration levels indicate urgency for new solutions');
    }
    
    if (redditData.keywords.includes('automation')) {
      insights.push('Strong interest in automation capabilities');
    }
    
    if (redditData.discussions.some(d => d.title.includes('ServiceNow'))) {
      insights.push('Active evaluation of ServiceNow alternatives');
    }
    
    return insights;
  }
}

module.exports = RedditService;