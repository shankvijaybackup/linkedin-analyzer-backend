const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const analyzeRoutes = require('./routes/analyze');
const knowledgeRoutes = require('./routes/knowledge');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure required directories exist
const ensureDirectories = () => {
  const dirs = ['data', 'uploads', 'uploads/knowledge'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

ensureDirectories();

// CORS Configuration - Fixed to properly handle your Vercel domain
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://analyzer-nlvblffui-linkedin-buddy.vercel.app', // Your specific Vercel domain
      'https://your-custom-domain.com' // Optional: replace with real domain
    ];
    
    // More flexible Vercel pattern that handles all variations
    const vercelPatterns = [
      /^https:\/\/analyzer-.*\.vercel\.app$/,
      /^https:\/\/.*-linkedin-buddy\.vercel\.app$/,
      /^https:\/\/.*\.vercel\.app$/
    ];

    // Check if origin is allowed
    const isAllowed = !origin || // Allow requests with no origin (like mobile apps)
      allowedOrigins.includes(origin) ||
      vercelPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      console.log(`✅ CORS: Allowing origin: ${origin || 'no-origin'}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Blocking origin: ${origin}`);
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/export', exportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LinkedIn Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze',
      knowledge: '/api/knowledge',
      export: '/api/export'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    message: `Route ${req.url} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;