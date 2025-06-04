// backend/routes/export.js
const express = require('express');
const router = express.Router();

// Store for analysis results (same as in analyze.js - use shared store in production)
const analysisResults = new Map();

// Export analysis data
router.get('/export/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    const result = analysisResults.get(id);
    
    if (!result || result.status !== 'completed') {
      return res.status(404).json({ 
        error: 'Analysis not found or incomplete',
        code: 'EXPORT_NOT_FOUND'
      });
    }

    const filename = `linkedin-analysis-${id}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({
        exportMetadata: {
          analysisId: id,
          exportDate: new Date().toISOString(),
          format: 'json',
          version: '1.0'
        },
        ...result.data
      });
      
    } else if (format === 'csv') {
      const csvData = convertToCSV(result.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
      
    } else if (format === 'report') {
      const reportHtml = generateHTMLReport(result.data);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="linkedin-analysis-${id}.html"`);
      res.send(reportHtml);
      
    } else {
      res.status(400).json({ 
        error: 'Unsupported export format',
        supportedFormats: ['json', 'csv', 'report']
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      details: error.message 
    });
  }
});

// Generate outreach email templates
router.get('/outreach-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = analysisResults.get(id);
    
    if (!result || !result.data.outreachMessages) {
      return res.status(404).json({ error: 'Outreach data not found' });
    }

    const templates = result.data.outreachMessages.map((msg, index) => ({
      id: `template_${index + 1}`,
      sender: msg.sender,
      subject: msg.subject,
      message: msg.message,
      focus: msg.focus,
      personalizations: extractPersonalizations(msg, result.data.profile)
    }));

    res.json({
      profileName: result.data.profile.name,
      templates,
      generatedDate: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate templates' });
  }
});

// Utility functions
function convertToCSV(data) {
  const headers = [
    'Name',
    'Title', 
    'Company',
    'Location',
    'Decision Authority',
    'Budget Influence',
    'Buying Intent',
    'Engagement Score',
    'Overall Score',
    'Experience Years',
    'Certifications Count',
    'Analysis Date'
  ];
  
  const rows = [headers.join(',')];
  
  // Profile data row
  const profile = data.profile;
  const metrics = data.metrics || {};
  
  rows.push([
    `"${profile.name || ''}"`,
    `"${profile.title || ''}"`,
    `"${profile.company || ''}"`,
    `"${profile.location || ''}"`,
    metrics.decisionAuthority || 0,
    metrics.budgetInfluence || 0,
    metrics.buyingIntent || 0,
    metrics.engagementScore || 0,
    metrics.overallScore || 0,
    calculateExperienceYears(profile.experience),
    (profile.certifications || []).length,
    new Date().toISOString()
  ].join(','));
  
  // Outreach messages summary
  rows.push(''); // Empty row
  rows.push('Outreach Messages:');
  rows.push('Sender,Focus,Subject,Message Length');
  
  (data.outreachMessages || []).forEach(msg => {
    rows.push([
      `"${msg.sender}"`,
      `"${msg.focus}"`, 
      `"${msg.subject}"`,
      msg.message.length
    ].join(','));
  });
  
  return rows.join('\n');
}

function generateHTMLReport(data) {
  const profile = data.profile;
  const metrics = data.metrics || {};
  const outreachMessages = data.outreachMessages || [];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedIn Analysis Report - ${profile.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .profile-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; }
        .outreach-message { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .sender-tag { background: #4f46e5; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
        h1 { color: #1f2937; margin: 0; }
        h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h3 { color: #4f46e5; margin-top: 0; }
        .summary-box { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .generated-date { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LinkedIn Analysis Report</h1>
        <p class="generated-date">Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="profile-section">
        <h2>Executive Profile</h2>
        <h3>${profile.name}</h3>
        <p><strong>Title:</strong> ${profile.title}</p>
        <p><strong>Company:</strong> ${profile.company}</p>
        <p><strong>Location:</strong> ${profile.location}</p>
        <p><strong>Summary:</strong> ${profile.summary || 'No summary available'}</p>
        
        <h4>Core Expertise</h4>
        <p>${(profile.expertise || []).join(', ') || 'Not specified'}</p>
        
        <h4>Certifications</h4>
        <p>${(profile.certifications || []).join(', ') || 'Not specified'}</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <h4>Decision Authority</h4>
            <p style="font-size: 24px; font-weight: bold; color: #059669;">${metrics.decisionAuthority || 0}%</p>
        </div>
        <div class="metric-card">
            <h4>Budget Influence</h4>
            <p style="font-size: 24px; font-weight: bold; color: #3b82f6;">${metrics.budgetInfluence || 0}%</p>
        </div>
        <div class="metric-card">
            <h4>Buying Intent</h4>
            <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${metrics.buyingIntent || 0}%</p>
        </div>
        <div class="metric-card">
            <h4>Overall Score</h4>
            <p style="font-size: 24px; font-weight: bold; color: #4f46e5;">${metrics.overallScore || 0}%</p>
        </div>
    </div>

    <div class="summary-box">
        <h2>Strategic Summary</h2>
        <pre style="white-space: pre-wrap; font-family: inherit;">${data.strategicSummary || 'No strategic summary available'}</pre>
    </div>

    <h2>Personalized Outreach Messages</h2>
    ${outreachMessages.map(msg => `
        <div class="outreach-message">
            <div class="sender-tag">${msg.sender} - ${msg.focus}</div>
            <h3>${msg.subject}</h3>
            <pre style="white-space: pre-wrap; font-family: inherit;">${msg.message}</pre>
        </div>
    `).join('')}

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>This report was generated by Atomicwork's LinkedIn Intent Analyzer. For more information, visit atomicwork.com</p>
    </div>
</body>
</html>
  `;
}

function extractPersonalizations(message, profile) {
  const personalizations = [];
  
  if (message.message.includes(profile.name)) {
    personalizations.push({ type: 'name', value: profile.name });
  }
  
  if (message.message.includes(profile.company)) {
    personalizations.push({ type: 'company', value: profile.company });
  }
  
  if (message.message.includes(profile.title)) {
    personalizations.push({ type: 'title', value: profile.title });
  }
  
  return personalizations;
}

function calculateExperienceYears(experiences) {
  if (!experiences || experiences.length === 0) return 0;
  
  let totalYears = 0;
  experiences.forEach(exp => {
    const duration = exp.duration || '';
    const years = duration.match(/(\d+)/);
    if (years) {
      totalYears += parseInt(years[1]);
    }
  });
  
  return totalYears;
}

module.exports = router;