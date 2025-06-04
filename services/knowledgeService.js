// backend/services/knowledgeService.js
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const removeMd = require('remove-markdown');
const multer = require('multer');

class KnowledgeService {
  constructor() {
    this.uploadDir = path.resolve('uploads', 'knowledge');
    this.dataFile = path.resolve('data', 'knowledge-base.json');
    this.knowledge = [];

    this.ensureDirectory(this.uploadDir);
    this.ensureDirectory(path.dirname(this.dataFile));

    if (fs.existsSync(this.dataFile)) {
      const raw = fs.readFileSync(this.dataFile, 'utf-8');
      this.knowledge = JSON.parse(raw);
      console.log(`📚 Loaded ${this.knowledge.length} knowledge entries`);
    } else {
      console.warn('⚠️ No knowledge base found at', this.dataFile);
    }
  }

  // Add the missing getUploadMiddleware method
  getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${timestamp}-${name}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.json'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${ext}. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10
      }
    });
  }

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }

  async processFile(file, meta) {
    const ext = path.extname(file.originalname).toLowerCase();
    const rawBuffer = fs.readFileSync(file.path);
    let text = '';

    try {
      if (ext === '.pdf') {
        const parsed = await pdfParse(rawBuffer);
        text = parsed.text;
      } else if (ext === '.docx') {
        const parsed = await mammoth.extractRawText({ buffer: rawBuffer });
        text = parsed.value;
      } else if (ext === '.txt') {
        text = rawBuffer.toString('utf-8');
      } else if (ext === '.md') {
        text = removeMd(rawBuffer.toString('utf-8'));
      } else if (ext === '.json') {
        const json = JSON.parse(rawBuffer.toString('utf-8'));
        text = JSON.stringify(json, null, 2);
      } else {
        throw new Error('Unsupported file type');
      }

      const chunks = this.chunkText(text);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        id,
        title: meta.title || file.originalname,
        filename: file.originalname,
        tags: meta.tags || [],
        category: meta.category || 'general',
        priority: meta.priority || 'medium',
        body: text,
        chunks,
        timestamp: new Date().toISOString()
      };

      this.knowledge.push(record);
      this.save();
      
      // Clean up uploaded file after processing
      fs.unlinkSync(file.path);
      
      console.log(`✅ Uploaded and processed: ${file.originalname}`);
      return record;

    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      console.error('❌ Error processing knowledge file:', error.message);
      throw error;
    }
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
    this.ensureDirectory(path.dirname(this.dataFile));
    fs.writeFileSync(this.dataFile, JSON.stringify(this.knowledge, null, 2));
  }

  listAll() {
    return this.knowledge.map(k => ({
      id: k.id,
      title: k.title,
      tags: k.tags,
      category: k.category,
      priority: k.priority
    }));
  }

  findByTag(tag) {
    return this.knowledge.filter(k => k.tags.includes(tag));
  }

  search(query) {
    const lower = query.toLowerCase();
    return this.knowledge.filter(k =>
      k.title.toLowerCase().includes(lower) ||
      k.body.toLowerCase().includes(lower)
    );
  }

  getRaw() {
    return this.knowledge;
  }
}

// Export an instance, not the class
module.exports = new KnowledgeService();