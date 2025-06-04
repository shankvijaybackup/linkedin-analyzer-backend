// backend/services/redditService.js
class RedditService {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.userAgent = 'LinkedInAnalyzer/1.0';
  }

  async getRedditIntent(jobTitle) {
    try {
      console.log(`🧠 Analyzing Reddit intent signals for: ${jobTitle}`);
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
    const t = jobTitle.toLowerCase();
    if (t.includes('cio') || t.includes('cto') || t.includes('vp')) {
      return {
        totalSignals: 8,
        painPoints: ['Digital transformation pressure', 'Modernization issues'],
        discussions: [{ subreddit: 'sysadmin', title: 'ServiceNow vs Alternatives', score: 112 }],
        sentiment: 'frustrated',
        keywords: ['automation', 'modernization']
      };
    }
    if (t.includes('manager') || t.includes('director')) {
      return {
        totalSignals: 6,
        painPoints: ['Ticket overload', 'Manual processes'],
        discussions: [{ subreddit: 'ITManagers', title: 'Reducing L1 volume', score: 85 }],
        sentiment: 'solution_seeking',
        keywords: ['ticketing', 'workflow']
      };
    }
    return {
      totalSignals: 3,
      painPoints: ['Generic inefficiencies'],
      discussions: [{ subreddit: 'technology', title: 'Service automation', score: 45 }],
      sentiment: 'neutral',
      keywords: ['self-service', 'ops']
    };
  }
}

module.exports = RedditService;
