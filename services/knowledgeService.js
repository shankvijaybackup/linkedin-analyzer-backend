// backend/services/knowledgeService.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const removeMd = require('remove-markdown');

class KnowledgeService {
  constructor() {
    this.uploadDir = path.resolve('uploads', 'knowledge');
    this.dataFile = path.resolve('data', 'knowledge-base.json');
    this.knowledge = [];
    this.ensureDirectory(this.uploadDir);

    if (fs.existsSync(this.dataFile)) {
      try {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        this.knowledge = Array.isArray(parsed) ? parsed : [];
        if (!Array.isArray(parsed)) {
          console.warn('⚠️ knowledge-base.json is not an array. Resetting to empty.');
        } else {
          console.log(`📚 Loaded ${this.knowledge.length} knowledge entries`);
        }
      } catch (e) {
        console.error('❌ Failed to parse knowledge-base.json:', e.message);
        this.knowledge = [];
      }
    }
  }

  static getUploadMiddleware() {
    return multer({
      dest: 'uploads/',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/markdown', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF, Markdown, or Plain text files are allowed'));
      }
    });
  }

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async processDocument(file, metadata) {
    const ext = path.extname(file.originalname).toLowerCase();
    const raw = fs.readFileSync(file.path);
    let text = '';

    if (ext === '.pdf') {
      text = (await pdfParse(raw)).text;
    } else if (ext === '.docx') {
      text = (await mammoth.extractRawText({ buffer: raw })).value;
    } else if (ext === '.txt') {
      text = raw.toString('utf-8');
    } else if (ext === '.md') {
      text = removeMd(raw.toString('utf-8'));
    } else if (ext === '.json') {
      text = JSON.stringify(JSON.parse(raw.toString('utf-8')), null, 2);
    } else {
      throw new Error('Unsupported file type');
    }

    const chunks = this.chunkText(text);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      filename: file.originalname,
      content: text,
      chunks,
      metadata: {
        ...metadata,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        fileType: ext.replace('.', '')
      }
    };

    this.knowledge.push(record);
    this.save();
    return record;
  }

  chunkText(text, chunkSize = 800) {
    const sentences = text.split(/(?<=[.?!])\s+/);
    const chunks = [];
    let current = [];

    for (const sentence of sentences) {
      const joined = current.concat(sentence).join(' ');
      if (joined.length >= chunkSize) {
        chunks.push(joined);
        current = [];
      } else {
        current.push(sentence);
      }
    }

    if (current.length) chunks.push(current.join(' '));
    return chunks;
  }

  save() {
    fs.writeFileSync(this.dataFile, JSON.stringify(this.knowledge, null, 2));
  }

  getKnowledgeStats() {
    const categories = {};
    this.knowledge.forEach(item => {
      const cat = item.metadata?.category || 'general';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const totalSize = this.knowledge.reduce((sum, item) => sum + (item.metadata.fileSize || 0), 0);

    return {
      totalDocuments: this.knowledge.length,
      categories,
      totalSize,
      recentUploads: this.knowledge.filter(item =>
        new Date(item.metadata.uploadDate) >= Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length
    };
  }
}

module.exports = KnowledgeService;
