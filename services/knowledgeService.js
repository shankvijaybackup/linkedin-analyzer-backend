// backend/services/knowledgeService.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdf = require('pdf-parse');

class KnowledgeService {
  constructor() {
    this.knowledgeBase = new Map();
    this.loadExistingKnowledge();
  }

  // Configure multer for file uploads
  getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/knowledge/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
          'text/markdown',
          'application/json'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Supported: PDF, DOCX, DOC, TXT, MD, JSON'));
        }
      }
    });
  }

  // Process uploaded documents
  async processDocument(file, metadata = {}) {
    try {
      console.log(`📄 Processing document: ${file.originalname}`);
      
      let content = '';
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      switch (fileExtension) {
        case '.pdf':
          content = await this.extractPdfContent(file.path);
          break;
        case '.docx':
          content = await this.extractDocxContent(file.path);
          break;
        case '.doc':
          content = await this.extractDocContent(file.path);
          break;
        case '.txt':
        case '.md':
          content = await this.extractTextContent(file.path);
          break;
        case '.json':
          content = await this.extractJsonContent(file.path);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Clean and structure the content
      const processedContent = this.cleanContent(content);
      
      // Create knowledge entry
      const knowledgeEntry = {
        id: this.generateId(),
        filename: file.originalname,
        content: processedContent,
        metadata: {
          uploadDate: new Date().toISOString(),
          fileSize: file.size,
          fileType: fileExtension,
          category: metadata.category || 'general',
          tags: metadata.tags || [],
          priority: metadata.priority || 'medium',
          ...metadata
        },
        chunks: this.chunkContent(processedContent)
      };

      // Store in knowledge base
      this.knowledgeBase.set(knowledgeEntry.id, knowledgeEntry);
      
      // Save to persistent storage
      await this.saveKnowledgeBase();
      
      // Clean up uploaded file
      await fs.unlink(file.path);
      
      console.log(`✅ Document processed successfully: ${file.originalname}`);
      return knowledgeEntry;
      
    } catch (error) {
      console.error(`❌ Error processing document ${file.originalname}:`, error);
      
      // Clean up file on error
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
      
      throw error;
    }
  }

  // Extract content from different file types
  async extractPdfContent(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      return 'Error extracting PDF content';
    }
  }

  async extractDocxContent(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return 'Error extracting DOCX content';
    }
  }

  async extractDocContent(filePath) {
    try {
      // Basic implementation for .doc files
      const dataBuffer = await fs.readFile(filePath);
      return dataBuffer.toString('utf8');
    } catch (error) {
      console.error('DOC extraction error:', error);
      return 'Error extracting DOC content';
    }
  }

  async extractTextContent(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error('Text extraction error:', error);
      return 'Error extracting text content';
    }
  }

  async extractJsonContent(filePath) {
    try {
      const jsonData = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(jsonData);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error('JSON extraction error:', error);
      return 'Error extracting JSON content';
    }
  }

  // Content processing
  cleanContent(content) {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  chunkContent(content, chunkSize = 1000) {
    const chunks = [];
    const sentences = content.split(/[.!?]+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '.';
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Search and retrieval
  async searchKnowledge(query, category = null, limit = 10) {
    const results = [];
    
    for (const [id, entry] of this.knowledgeBase) {
      if (category && entry.metadata.category !== category) continue;
      
      const relevanceScore = this.calculateRelevance(query, entry);
      if (relevanceScore > 0.1) {
        results.push({
          id,
          filename: entry.filename,
          content: entry.content.substring(0, 500) + '...',
          metadata: entry.metadata,
          relevanceScore
        });
      }
    }
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  calculateRelevance(query, entry) {
    const queryLower = query.toLowerCase();
    const contentLower = entry.content.toLowerCase();
    
    // Simple relevance scoring
    let score = 0;
    const queryWords = queryLower.split(/\s+/);
    
    for (const word of queryWords) {
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += occurrences / entry.content.length * 1000;
    }
    
    // Boost score based on metadata
    if (entry.metadata.category === 'outreach_templates') score *= 1.5;
    if (entry.metadata.priority === 'high') score *= 1.3;
    
    return Math.min(score, 1); // Normalize to 0-1
  }

  // Knowledge base management
  async loadExistingKnowledge() {
    try {
      const knowledgeData = await fs.readFile('data/knowledge-base.json', 'utf8');
      const parsed = JSON.parse(knowledgeData);
      
      for (const [id, entry] of Object.entries(parsed)) {
        this.knowledgeBase.set(id, entry);
      }
      
      console.log(`📚 Loaded ${this.knowledgeBase.size} knowledge entries`);
    } catch (error) {
      console.log('📚 No existing knowledge base found, starting fresh');
    }
  }

  async saveKnowledgeBase() {
    try {
      await fs.mkdir('data', { recursive: true });
      const knowledgeObject = Object.fromEntries(this.knowledgeBase);
      await fs.writeFile(
        'data/knowledge-base.json', 
        JSON.stringify(knowledgeObject, null, 2)
      );
    } catch (error) {
      console.error('Error saving knowledge base:', error);
    }
  }

  // Statistics and management
  getKnowledgeStats() {
    const stats = {
      totalDocuments: this.knowledgeBase.size,
      categories: {},
      totalSize: 0,
      recentUploads: 0
    };
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const entry of this.knowledgeBase.values()) {
      // Category breakdown
      const category = entry.metadata.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Total size
      stats.totalSize += entry.metadata.fileSize || 0;
      
      // Recent uploads
      if (new Date(entry.metadata.uploadDate) > oneWeekAgo) {
        stats.recentUploads++;
      }
    }
    
    return stats;
  }

  async deleteKnowledge(id) {
    if (this.knowledgeBase.has(id)) {
      this.knowledgeBase.delete(id);
      await this.saveKnowledgeBase();
      return true;
    }
    return false;
  }

  generateId() {
    return 'kb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Categories for organization
  getCategories() {
    return [
      'outreach_templates',
      'product_information', 
      'industry_insights',
      'competitor_analysis',
      'case_studies',
      'sales_playbooks',
      'technical_documentation',
      'general'
    ];
  }
}

module.exports = KnowledgeService;