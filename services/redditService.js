// backend/services/redditService.js
class RedditService {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.userAgent = 'LinkedInAnalyzer/1.0';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async getRedditIntent(jobTitle) {
    try {
      console.log(`🧠 Analyzing Reddit intent signals for: ${jobTitle}`);
      
      // Check cache first
      const cacheKey = jobTitle.toLowerCase().trim();
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`📋 Using cached Reddit analysis for: ${jobTitle}`);
        return cached.data;
      }

      const intentSignals = this.generateRedditAnalysis(jobTitle);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: intentSignals,
        timestamp: Date.now()
      });

      return intentSignals;
    } catch (error) {
      console.error('❌ Reddit intent analysis failed:', error.message);
      return {
        jobTitle,
        signals: 0,
        painPoints: [],
        discussions: [],
        sentiment: 'neutral',
        keywords: [],
        error: 'Analysis unavailable',
        analysisDate: new Date().toISOString()
      };
    }
  }

  generateRedditAnalysis(jobTitle) {
    const t = jobTitle.toLowerCase();
    const baseAnalysis = {
      jobTitle,
      analysisDate: new Date().toISOString(),
      source: 'simulated_reddit_analysis'
    };

    // C-Level and VP Analysis
    if (t.includes('cio') || t.includes('cto') || t.includes('chief')) {
      return {
        ...baseAnalysis,
        signals: 9,
        painPoints: [
          'Digital transformation initiatives stalling',
          'Legacy system modernization challenges',
          'ROI pressure on technology investments',
          'Talent acquisition difficulties'
        ],
        discussions: [
          { subreddit: 'CIO', title: 'ServiceNow implementation lessons learned', score: 156, engagement: 'high' },
          { subreddit: 'sysadmin', title: 'Enterprise automation strategies that actually work', score: 243, engagement: 'high' },
          { subreddit: 'ITManagement', title: 'Justifying ITSM platform costs to board', score: 89, engagement: 'medium' }
        ],
        sentiment: 'solution_seeking',
        keywords: ['automation', 'modernization', 'roi', 'enterprise', 'digital transformation'],
        urgency: 'high',
        budgetCycle: 'Q4_planning'
      };
    }

    // VP Level Analysis
    if (t.includes('vp') || t.includes('vice president')) {
      return {
        ...baseAnalysis,
        signals: 8,
        painPoints: [
          'Team productivity bottlenecks',
          'Cross-department workflow inefficiencies',
          'Reporting and visibility gaps',
          'Vendor management complexity'
        ],
        discussions: [
          { subreddit: 'ITManagers', title: 'Streamlining IT operations across departments', score: 178, engagement: 'high' },
          { subreddit: 'technology', title: 'Best practices for service management', score: 134, engagement: 'medium' },
          { subreddit: 'BusinessIntelligence', title: 'KPI tracking for IT teams', score: 67, engagement: 'medium' }
        ],
        sentiment: 'frustrated',
        keywords: ['productivity', 'workflow', 'visibility', 'operations', 'efficiency'],
        urgency: 'medium-high',
        budgetCycle: 'annual_review'
      };
    }

    // Director Level Analysis
    if (t.includes('director') || t.includes('head of')) {
      return {
        ...baseAnalysis,
        signals: 7,
        painPoints: [
          'Manual process overhead',
          'Ticket volume management',
          'Team burnout from repetitive tasks',
          'SLA compliance challenges'
        ],
        discussions: [
          { subreddit: 'ITManagers', title: 'Reducing manual ticket routing', score: 124, engagement: 'high' },
          { subreddit: 'sysadmin', title: 'Automation wins that saved our sanity', score: 298, engagement: 'very_high' },
          { subreddit: 'ITIL', title: 'SLA improvements through workflow automation', score: 85, engagement: 'medium' }
        ],
        sentiment: 'solution_seeking',
        keywords: ['automation', 'ticketing', 'workflow', 'sla', 'efficiency'],
        urgency: 'medium',
        budgetCycle: 'quarterly'
      };
    }

    // Manager Level Analysis
    if (t.includes('manager') || t.includes('lead')) {
      return {
        ...baseAnalysis,
        signals: 6,
        painPoints: [
          'Daily operational firefighting',
          'Limited visibility into team workload',
          'Manual reporting requirements',
          'User satisfaction concerns'
        ],
        discussions: [
          { subreddit: 'ITManagers', title: 'Tools to reduce L1 support volume', score: 167, engagement: 'high' },
          { subreddit: 'sysadmin', title: 'Self-service portal implementations', score: 203, engagement: 'high' },
          { subreddit: 'Help Desk', title: 'Metrics that matter for support teams', score: 92, engagement: 'medium' }
        ],
        sentiment: 'problem_aware',
        keywords: ['support', 'self-service', 'metrics', 'workload', 'user satisfaction'],
        urgency: 'medium',
        budgetCycle: 'departmental'
      };
    }

    // Senior/Specialist Level Analysis
    if (t.includes('senior') || t.includes('specialist') || t.includes('analyst')) {
      return {
        ...baseAnalysis,
        signals: 5,
        painPoints: [
          'Repetitive manual tasks',
          'Knowledge sharing challenges',
          'Tool fragmentation',
          'Career development concerns'
        ],
        discussions: [
          { subreddit: 'sysadmin', title: 'Automating routine maintenance tasks', score: 234, engagement: 'high' },
          { subreddit: 'ITCareerQuestions', title: 'Skills for IT automation specialists', score: 145, engagement: 'medium' },
          { subreddit: 'technology', title: 'Knowledge management best practices', score: 78, engagement: 'medium' }
        ],
        sentiment: 'learning_oriented',
        keywords: ['automation', 'skills', 'tools', 'maintenance', 'knowledge'],
        urgency: 'low-medium',
        budgetCycle: 'skill_development'
      };
    }

    // Default/General Analysis
    return {
      ...baseAnalysis,
      signals: 4,
      painPoints: [
        'General operational inefficiencies',
        'Process improvement opportunities',
        'Technology adoption challenges'
      ],
      discussions: [
        { subreddit: 'technology', title: 'Service automation trends', score: 112, engagement: 'medium' },
        { subreddit: 'ITSupport', title: 'Improving user experience', score: 89, engagement: 'medium' }
      ],
      sentiment: 'neutral',
      keywords: ['efficiency', 'processes', 'technology', 'improvement'],
      urgency: 'low',
      budgetCycle: 'standard'
    };
  }

  // Helper method to clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Reddit analysis cache cleared');
  }

  // Helper method to get cache stats
  getCacheStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = RedditService;