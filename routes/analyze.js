// backend/routes/analyze.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const LinkedInService = require('../services/linkedinService');
const AIService = require('../services/aiService');
const RedditService = require('../services/redditService');

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

const linkedinService = new LinkedInService();
const aiService = new AIService();
const redditService = new RedditService();
const analysisResults = new Map();
const analysisTimeouts = new Map();

// Create analysis
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
      stage: 'Initializing...',
      startTime: new Date().toISOString()
    });

    analysisTimeouts.set(analysisId, setTimeout(() => {
      analysisResults.delete(analysisId);
      analysisTimeouts.delete(analysisId);
    }, 60 * 60 * 1000)); // 1 hour expiry

    res.json({ analysisId, status: 'started' });

    performAnalysis(linkedinUrl, analysisId).catch(err => {
      analysisResults.set(analysisId, {
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const result = analysisResults.get(id);
  if (result) return res.json(result);

  const file = path.resolve('data', `${id}.json`);
  if (fs.existsSync(file)) return res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));

  return res.status(404).json({ error: 'Analysis not found or expired' });
});

router.get('/json/:id', (req, res) => {
  const { id } = req.params;
  const file = path.resolve('data', `${id}.json`);
  if (fs.existsSync(file)) return res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  return res.status(404).json({ error: 'Not found' });
});

// Main processing logic
async function performAnalysis(linkedinUrl, analysisId) {
  try {
    updateAnalysisStatus(analysisId, { progress: 10, stage: '🔍 Extracting LinkedIn Profile' });
    const rawProfile = await linkedinService.getPersonDetails(linkedinUrl);
    const profile = linkedinService.formatProfileData(rawProfile);

    updateAnalysisStatus(analysisId, { progress: 25, stage: '🏢 Enriching Company Context' });
    const companyUrl = rawProfile.experiences?.[0]?.company_linkedin_profile_url || null;
    const company = companyUrl
      ? await linkedinService.getCompanyDetails(companyUrl)
      : linkedinService.getMockCompanyData();

    updateAnalysisStatus(analysisId, { progress: 40, stage: '🔬 Analyzing Reddit Intent Signals' });
    const redditIntent = await redditService.getRedditIntent(profile.title);

    updateAnalysisStatus(analysisId, { progress: 60, stage: '📊 Creating Strategic Summary' });
    const summary = await aiService.summarizeIntent(profile, company, redditIntent);

    updateAnalysisStatus(analysisId, { progress: 80, stage: '✍️ Generating DISC Outreach' });
    const tonePersona = aiService.inferDISC(profile);
    const outreach = await aiService.generateOutreach(profile, summary, company, redditIntent, tonePersona);
    const outreachMessages = Array.isArray(outreach) ? outreach : [];

    updateAnalysisStatus(analysisId, { progress: 95, stage: '📦 Finalizing and Saving' });
    const metrics = calculateMetrics(profile, company, redditIntent);

    const final = {
      status: 'completed',
      progress: 100,
      stage: '✅ Done',
      data: {
        profile,
        company,
        strategicSummary: summary,
        redditIntent,
        outreachMessages,
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

    analysisResults.set(analysisId, final);
    await ensureDataDirectory();
    fs.writeFileSync(path.resolve('data', `${analysisId}.json`), JSON.stringify(final, null, 2));
    console.log(`✅ Completed analysis: ${analysisId}`);
  } catch (err) {
    updateAnalysisStatus(analysisId, {
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Utilities
function updateAnalysisStatus(id, updates) {
  const current = analysisResults.get(id) || {};
  analysisResults.set(id, { ...current, ...updates });
}

async function ensureDataDirectory() {
  const dir = path.resolve('data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('📁 Created data directory');
  }
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
  const base = calculateDecisionAuthority(title);
  const size = company.company_size || 0;
  if (size > 1000) return Math.min(base + 10, 100);
  if (size > 500) return Math.min(base + 5, 100);
  return base;
}

function calculateBuyingIntent(profile, redditIntent) {
  let score = 60;
  ['digital transformation', 'modernization', 'cloud', 'automation'].forEach(term => {
    if ((profile.summary || '').toLowerCase().includes(term)) score += 5;
  });
  if (redditIntent?.signals > 0) score += 10;
  return Math.min(score, 100);
}

function calculateEngagementScore(profile) {
  let score = 70;
  if (profile.connections > 500) score += 10;
  if (profile.followerCount > 1000) score += 5;
  if (profile.summary?.length > 200) score += 5;
  return Math.min(score, 100);
}

module.exports = router;
