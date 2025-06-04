// backend/routes/knowledge.js
const express = require('express');
const knowledgeService = require('../services/knowledgeService');
const upload = knowledgeService.getUploadMiddleware();

const router = express.Router();

// Upload documents endpoint
router.post('/upload', upload.array('documents', 10), async (req, res) => {
  try {
    console.log('📤 Knowledge upload request received');

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded', code: 'NO_FILES' });
    }

    const { category = 'general', tags = '', priority = 'medium' } = req.body;
    const metadata = {
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      priority,
      uploadedBy: req.user?.id || 'anonymous',
      source: 'manual_upload'
    };

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        console.log(`📄 Processing file: ${file.originalname}`);
        const result = await knowledgeService.processFile(file, metadata);
        results.push({
          filename: file.originalname,
          id: result.id,
          status: 'success',
          category: result.category,
          chunks: result.chunks.length
        });
      } catch (error) {
        console.error(`❌ Error processing ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error.message,
          status: 'failed'
        });
      }
    }

    res.json({
      message: `Successfully processed ${results.length} out of ${req.files.length} files`,
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: req.files.length
      }
    });
  } catch (error) {
    console.error('❌ Knowledge upload error:', error);
    res.status(500).json({ error: 'Upload processing failed', details: error.message, code: 'UPLOAD_ERROR' });
  }
});

// List all knowledge entries
router.get('/', async (req, res) => {
  try {
    const list = knowledgeService.listAll();
    res.json({ items: list, total: list.length });
  } catch (error) {
    console.error('❌ Error fetching knowledge items:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge items', code: 'FETCH_ERROR' });
  }
});

// Get knowledge stats - ADD THIS MISSING ENDPOINT
router.get('/stats', async (req, res) => {
  try {
    const stats = knowledgeService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching knowledge stats:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge stats', code: 'STATS_ERROR' });
  }
});

// Search knowledge base
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing search query', code: 'MISSING_QUERY' });

    const results = knowledgeService.search(query);
    res.json({ query, results, total: results.length });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message, code: 'SEARCH_ERROR' });
  }
});

// Get all raw data
router.get('/raw', async (req, res) => {
  try {
    const data = knowledgeService.getRaw();
    res.json({ items: data });
  } catch (error) {
    console.error('❌ Error fetching raw knowledge:', error);
    res.status(500).json({ error: 'Failed to fetch raw knowledge', code: 'FETCH_ERROR' });
  }
});

module.exports = router;