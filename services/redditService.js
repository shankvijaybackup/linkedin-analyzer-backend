// backend/services/redditService.js
const axios = require('axios');

class RedditService {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.userAgent = 'LinkedInAnalyzer/1.0';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes

    this.googleApiKey = process.env.GOOGLE_API_KEY;
    this.googleCx = process.env.GOOGLE_CX;
  }

  async getRedditIntent(jobTitle) {
    try {
      const key = jobTitle.toLowerCase().trim();
      const cached = this.cache.get(key);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`📋 Using cached Reddit analysis for: ${jobTitle}`);
        return cached.data;
      }

      const roleBased = this.generateRedditAnalysis(jobTitle);

      // If no strong match, fallback to Google CSE over Reddit
      if (roleBased.signals < 5) {
        const fallback = await this.fetchFallbackSignals(jobTitle);
        roleBased.signals = fallback.signals;
        roleBased.keywords = [...new Set([...roleBased.keywords, ...fallback.keywords])].slice(0, 10);
        roleBased.discussions = fallback.sources.map(url => ({ subreddit: 'reddit.com', title: url, score: 0, engagement: 'unknown' }));
      }

      this.cache.set(key, { data: roleBased, timestamp: Date.now() });
      return roleBased;
    } catch (error) {
      console.error('❌ Reddit intent analysis failed:', error.message);
      return {
        jobTitle,
        signals: 0,
        sentiment: 'neutral',
        painPoints: [],
        discussions: [],
        keywords: [],
        error: 'Analysis unavailable',
        analysisDate: new Date().toISOString()
      };
    }
  }

  generateRedditAnalysis(jobTitle) {
    const t = jobTitle.toLowerCase();
    const base = {
      jobTitle,
      analysisDate: new Date().toISOString(),
      sentiment: 'solution_seeking',
      source: 'heuristic'
    };

    if (t.includes('cio') || t.includes('cto') || t.includes('chief')) {
      return {
        ...base,
        signals: 9,
        painPoints: ['Digital transformation stalls', 'Legacy modernization', 'Cloud cost visibility', 'Scaling AI automation'],
        discussions: [
          { subreddit: 'CIO', title: 'How CIOs think about AI platforms', score: 180, engagement: 'high' }
        ],
        keywords: ['automation', 'modernization', 'ROI', 'digital', 'enterprise']
      };
    }

    if (t.includes('vp') || t.includes('vice president')) {
      return {
        ...base,
        signals: 8,
        painPoints: ['Team productivity', 'Workflow gaps', 'Reporting', 'Cross-team collaboration'],
        discussions: [
          { subreddit: 'ITManagers', title: 'Streamlining IT operations', score: 130, engagement: 'medium' }
        ],
        keywords: ['efficiency', 'visibility', 'KPIs', 'workflow']
      };
    }

    if (t.includes('director') || t.includes('head of')) {
      return {
        ...base,
        signals: 7,
        painPoints: ['Manual work', 'Burnout', 'SLAs', 'Automation deficit'],
        discussions: [
          { subreddit: 'sysadmin', title: 'Reducing repetitive requests', score: 110, engagement: 'medium' }
        ],
        keywords: ['automation', 'sla', 'volume', 'repetition']
      };
    }

    if (t.includes('manager') || t.includes('lead')) {
      return {
        ...base,
        signals: 6,
        painPoints: ['Firefighting', 'Manual updates', 'Low self-service adoption'],
        discussions: [
          { subreddit: 'HelpDesk', title: 'Improving user experience', score: 90, engagement: 'medium' }
        ],
        keywords: ['support', 'self-service', 'tickets', 'workflow']
      };
    }

    if (t.includes('senior') || t.includes('specialist') || t.includes('analyst')) {
      return {
        ...base,
        signals: 5,
        painPoints: ['Tool fatigue', 'Knowledge gaps', 'Career mobility'],
        discussions: [
          { subreddit: 'ITCareerQuestions', title: 'Best upskilling path for IT', score: 70, engagement: 'medium' }
        ],
        keywords: ['knowledge', 'learning', 'tools', 'maintenance']
      };
    }

    return {
      ...base,
      signals: 3,
      painPoints: ['General inefficiencies'],
      discussions: [],
      keywords: []
    };
  }

  async fetchFallbackSignals(jobTitle) {
    try {
      console.log(`🌐 Using Google fallback for: ${jobTitle}`);
      const q = `Reddit "${jobTitle}" pain points IT automation`;
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${this.googleApiKey}&cx=${this.googleCx}`;
      const res = await axios.get(url);
      const items = res.data.items || [];
      const snippets = items.flatMap(i => (i.snippet || '').match(/\b(\w{6,})\b/g) || []);
      return {
        signals: items.length,
        keywords: [...new Set(snippets)].slice(0, 8),
        sources: items.map(i => i.link)
      };
    } catch (err) {
      console.warn('🛑 Google fallback failed:', err.message);
      return { signals: 0, keywords: [], sources: [] };
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Reddit analysis cache cleared');
  }

  getCacheStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = RedditService;
