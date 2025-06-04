// backend/routes/analyze.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const LinkedInService = require('../services/linkedinService');
const AIService = require('../services/aiService');
const RedditService = require('../services/redditService'); // Fixed import

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

const linkedinService = new LinkedInService();
const aiService = new AIService();
const redditService = new RedditService(); // Fixed instantiation
const analysisResults = new Map();
const analysisTimeouts = new Map();

// Start new analysis
router.post('/', async (req, res) => {
  try {
    const { linkedinUrl } = req.body;
    if (!linkedinUrl || !linkedinService.validateLinkedInURL(linkedinUrl)) {
      return res.status(400).json({ error: 'Invalid or missing LinkedIn URL' });
    }

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    analysisResults.set(analysisId, {
      status: 'started',
      progress: 0,
      stage: 'Initializing analysis...',
      startTime: new Date().toISOString()
    });

    analysisTimeouts.set(analysisId, setTimeout(() => {
      analysisResults.delete(analysisId);
      analysisTimeouts.delete(analysisId);
    }, 60 * 60 * 1000)); // 1 hour cleanup

    res.json({ analysisId, status: 'started', message: 'Analysis initiated successfully' });

    performAnalysis(linkedinUrl, analysisId).catch(err => {
      analysisResults.set(analysisId, {
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Check status
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const memory = analysisResults.get(id);
  if (memory) return res.json(memory);
  const filePath = path.resolve('data', `${id}.json`);
  if (fs.existsSync(filePath)) return res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  return res.status(404).json({ error: 'Analysis not found or expired' });
});

router.get('/json/:id', async (req, res) => {
  const { id } = req.params;
  const filePath = path.resolve('data', `${id}.json`);
  if (fs.existsSync(filePath)) return res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  return res.status(404).json({ error: 'Not found', message: `Analysis ${id} not found` });
});

async function ensureDataDirectory() {
  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }
}

ensureDataDirectory();

async function performAnalysis(linkedinUrl, analysisId) {
  try {
    updateAnalysisStatus(analysisId, { status: 'processing', progress: 10, stage: 'Extracting LinkedIn Profile Data' });
    const rawProfile = await linkedinService.getPersonDetails(linkedinUrl);
    const profile = linkedinService.formatProfileData(rawProfile);

    updateAnalysisStatus(analysisId, { status: 'processing', progress: 25, stage: 'Fetching Company Intelligence' });
    const companyUrl = rawProfile.experiences?.[0]?.company_linkedin_profile_url || rawProfile.experiences?.[0]?.company_linkedin_url || null;
    const company = companyUrl ? await linkedinService.getCompanyDetails(companyUrl) : linkedinService.getMockCompanyData();

    updateAnalysisStatus(analysisId, { status: 'processing', progress: 40, stage: 'Analyzing Strategic Context' });
    const redditIntent = await redditService.getRedditIntent(profile.title); // Fixed method call

    updateAnalysisStatus(analysisId, { status: 'processing', progress: 60, stage: 'Generating Strategic Summary' });
    const strategicSummary = await aiService.summarizeIntent(profile, company, redditIntent);

    updateAnalysisStatus(analysisId, { status: 'processing', progress: 80, stage: 'Creating Personalized Outreach' });
    const tonePersona = aiService.inferDISC(profile);
    const outreachMessages = await aiService.generateOutreach(profile, strategicSummary, company, redditIntent, tonePersona);
    
    // Ensure outreach messages is an array
    const validOutreach = Array.isArray(outreachMessages) ? outreachMessages : [];

    updateAnalysisStatus(analysisId, { status: 'processing', progress: 95, stage: 'Finalizing Analysis' });
    const metrics = calculateMetrics(profile, company, redditIntent);

    const finalResult = {
      status: 'completed',
      progress: 100,
      stage: 'Analysis Complete',
      data: {
        profile,
        company,
        strategicSummary,
        outreachMessages: validOutreach,
        redditIntent,
        metrics,
        metadata: {
          analysisId,
          analyzedUrl: linkedinUrl,
          analysisDate: new Date().toISOString(),
          processingTime: Date.now() - new Date(analysisResults.get(analysisId).startTime).getTime()
        }
      },
      completedAt: new Date().toISOString()
    };

    analysisResults.set(analysisId, finalResult);
    await ensureDataDirectory();
    fs.writeFileSync(path.resolve('data', `${analysisId}.json`), JSON.stringify(finalResult, null, 2));
    console.log(`✅ Analysis ${analysisId} completed successfully`);
  } catch (error) {
    updateAnalysisStatus(analysisId, {
      status: 'error',
      error: error.message,
      errorCode: error.code || 'ANALYSIS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

function updateAnalysisStatus(id, updates) {
  const current = analysisResults.get(id) || {};
  analysisResults.set(id, { ...current, ...updates });
}

function calculateMetrics(profile, company, redditIntent) {
  const da = calculateDecisionAuthority(profile.title);
  const bi = calculateBudgetInfluence(profile.title, company);
  const intent = calculateBuyingIntent(profile, redditIntent);
  const engagement = calculateEngagementScore(profile);
  return {
    decisionAuthority: da,
    budgetInfluence: bi,
    buyingIntent: intent,
    engagementScore: engagement,
    overallScore: Math.round((da + bi + intent + engagement) / 4)
  };
}

function calculateDecisionAuthority(title) {
  const t = title.toLowerCase();
  if (t.includes('cio') || t.includes('cto') || t.includes('vp')) return 95;
  if (t.includes('director') || t.includes('head')) return 85;
  if (t.includes('manager') || t.includes('lead')) return 75;
  if (t.includes('senior')) return 65;
  return 55;
}

function calculateBudgetInfluence(title, company) {
  const score = calculateDecisionAuthority(title);
  const size = company.company_size || 0;
  if (size > 1000) return Math.min(score + 10, 100);
  if (size > 500) return Math.min(score + 5, 100);
  return score;
}

function calculateBuyingIntent(profile, redditIntent) {
  let score = 60;
  ['digital transformation', 'modernization', 'cloud', 'automation', 'efficiency'].forEach(k => {
    if ((profile.summary || '').toLowerCase().includes(k)) score += 5;
  });
  if (redditIntent && redditIntent.signals > 0) score += 10;
  return Math.min(score, 100);
}

function calculateEngagementScore(profile) {
  let score = 70;
  if (profile.connections > 500) score += 10;
  if (profile.followerCount > 1000) score += 5;
  if (profile.summary && profile.summary.length > 200) score += 5;
  return Math.min(score, 100);
}

module.exports = router;