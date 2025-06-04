// backend/routes/knowledge.js
const express = require('express');
const KnowledgeService = require('../services/knowledgeService');

const router = express.Router();
const knowledgeService = new KnowledgeService();

// Upload middleware
const upload = knowledgeService.getUploadMiddleware();

// Upload documents endpoint
router.post('/upload', upload.array('documents', 10), async (req, res) => {
  try {
    console.log('📤 Knowledge upload request received');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        code: 'NO_FILES'
      });
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

    // Process each file
    for (const file of req.files) {
      try {
        console.log(`📄 Processing file: ${file.originalname}`);
        const result = await knowledgeService.processDocument(file, metadata);
        results.push({
          filename: file.originalname,
          id: result.id,
          status: 'success',
          category: result.metadata.category,
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

    console.log(`✅ Processed ${results.length} documents successfully, ${errors.length} failed`);

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
    res.status(500).json({ 
      error: 'Upload processing failed',
      details: error.message,
      code: 'UPLOAD_ERROR'
    });
  }
});

// Get all knowledge items
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      limit = 50, 
      offset = 0,
      sortBy = 'uploadDate',
      sortOrder = 'desc'
    } = req.query;

    let items = Array.from(knowledgeService.knowledgeBase.values());

    // Apply filters
    if (category && category !== 'all') {
      items = items.filter(item => item.metadata.category === category);
    }

    if (search) {
      const searchResults = await knowledgeService.searchKnowledge(search, category);
      const searchIds = new Set(searchResults.map(r => r.id));
      items = items.filter(item => searchIds.has(item.id));
    }

    // Sort items
    items.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'category':
          aValue = a.metadata.category;
          bValue = b.metadata.category;
          break;
        case 'size':
          aValue = a.metadata.fileSize || 0;
          bValue = b.metadata.fileSize || 0;
          break;
        case 'uploadDate':
        default:
          aValue = new Date(a.metadata.uploadDate);
          bValue = new Date(b.metadata.uploadDate);
          break;
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    // Apply pagination
    const paginatedItems = items.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Format response (don't send full content, just preview)
    const formattedItems = paginatedItems.map(item => ({
      id: item.id,
      filename: item.filename,
      content: item.content.substring(0, 300) + (item.content.length > 300 ? '...' : ''),
      metadata: item.metadata,
      chunksCount: item.chunks?.length || 0,
      size: item.metadata.fileSize
    }));

    res.json({
      items: formattedItems,
      pagination: {
        total: items.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: items.length > parseInt(offset) + parseInt(limit)
      },
      filters: {
        category,
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('❌ Error fetching knowledge items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch knowledge items',
      code: 'FETCH_ERROR'
    });
  }
});

// Get knowledge statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = knowledgeService.getKnowledgeStats();
    
    res.json({
      ...stats,
      categories: Object.entries(stats.categories).map(([name, count]) => ({
        name,
        count,
        label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching knowledge stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      code: 'STATS_ERROR'
    });
  }
});

// Get specific knowledge item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = knowledgeService.knowledgeBase.get(id);
    
    if (!item) {
      return res.status(404).json({ 
        error: 'Knowledge item not found',
        code: 'NOT_FOUND'
      });
    }

    res.json(item);
  } catch (error) {
    console.error('❌ Error fetching knowledge item:', error);
    res.status(500).json({ 
      error: 'Failed to fetch knowledge item',
      code: 'FETCH_ERROR'
    });
  }
});

// Delete knowledge item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await knowledgeService.deleteKnowledge(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Knowledge item not found',
        code: 'NOT_FOUND'
      });
    }

    console.log(`🗑️ Deleted knowledge item: ${id}`);
    res.json({ 
      message: 'Knowledge item deleted successfully',
      id 
    });
  } catch (error) {
    console.error('❌ Error deleting knowledge item:', error);
    res.status(500).json({ 
      error: 'Failed to delete knowledge item',
      code: 'DELETE_ERROR'
    });
  }
});

// Search knowledge base
router.post('/search', async (req, res) => {
  try {
    const { 
      query, 
      category = null, 
      limit = 10,
      includeContent = false
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Search query is required',
        code: 'MISSING_QUERY'
      });
    }

    const results = await knowledgeService.searchKnowledge(
      query.trim(), 
      category === 'all' ? null : category, 
      parseInt(limit)
    );

    // Format results
    const formattedResults = results.map(result => ({
      id: result.id,
      filename: result.filename,
      content: includeContent ? result.content : result.content.substring(0, 200) + '...',
      metadata: result.metadata,
      relevanceScore: Math.round(result.relevanceScore * 100),
      matchType: result.relevanceScore > 0.5 ? 'high' : result.relevanceScore > 0.2 ? 'medium' : 'low'
    }));

    res.json({
      query,
      results: formattedResults,
      totalResults: results.length,
      searchStats: {
        avgRelevance: results.length > 0 
          ? Math.round(results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length * 100)
          : 0,
        highRelevance: results.filter(r => r.relevanceScore > 0.5).length,
        mediumRelevance: results.filter(r => r.relevanceScore > 0.2 && r.relevanceScore <= 0.5).length,
        lowRelevance: results.filter(r => r.relevanceScore <= 0.2).length
      }
    });

  } catch (error) {
    console.error('❌ Error searching knowledge base:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message,
      code: 'SEARCH_ERROR'
    });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  try {
    const categories = knowledgeService.getCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      code: 'CATEGORIES_ERROR'
    });
  }
});

module.exports = router;