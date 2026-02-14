/**
 * Main Express server
 * Concept Dependency Tree Backend - Node.js Edition
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB, disconnectDB } = require('./utils/db');
const config = require('./config');

// Import routes
const conceptRoutes = require('./routes/conceptRoutes');
const userRoutes = require('./routes/userRoutes');
const parserRoutes = require('./routes/parserRoutes');
const treeRoutes = require('./routes/treeRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Concept Dependency Tree Backend (Node.js)',
    version: '2.0.0',
    environment: config.NODE_ENV
  });
});

// API Routes
app.use('/api/concepts', conceptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parser', parserRoutes);
app.use('/api/trees', treeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`\n🚀 Concept Dependency Tree Backend (Node.js)`);
      console.log(`📍 Server running on http://localhost:${PORT}`);
      console.log(`🔌 Environment: ${config.NODE_ENV}`);
      console.log(`🧠 Gemini API: ${config.GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured'}\n`);
      
      console.log('Available Endpoints:');
      console.log('  Concepts:  GET/POST  /api/concepts');
      console.log('  Users:     GET/POST  /api/users/:userId');
      console.log('  Parser:    POST      /api/parser/parse');
      console.log('  Status:    GET       /api/parser/status');
      console.log('  Trees:     CRUD      /api/trees/:userId');
      console.log('  Health:    GET       /health\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nShutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
