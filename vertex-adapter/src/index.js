// Vertex AI OpenAI-Compatible Adapter
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// Import routes
const chatRoutes = require('./routes/chat');
const modelsRoutes = require('./routes/models');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
      }`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Make logger globally available
global.logger = logger;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Vertex AI OpenAI Adapter',
    timestamp: new Date().toISOString(),
    version: require('../package.json').version
  });
});

// OpenAI-compatible API routes
app.use('/v1/chat', chatRoutes);
app.use('/v1/models', modelsRoutes);

// Catch-all for unsupported endpoints
app.use('/v1/*', (req, res) => {
  logger.warn(`Unsupported endpoint: ${req.method} ${req.path}`);
  res.status(404).json({
    error: {
      message: `The endpoint ${req.method} ${req.path} is not supported by this adapter`,
      type: 'not_found',
      code: 'endpoint_not_found'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'server_error',
      code: 'internal_error'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Vertex AI Adapter server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Google Cloud Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
  logger.info(`AI Model: ${process.env.AI_MODEL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;