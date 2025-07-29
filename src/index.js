// BookAI - Main Application Entry Point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import configurations
const { supabase } = require('../config/supabase');
const vertexAIService = require('./services/vertexai');
const chatRoutes = require('./routes/chat');
const modelRoutes = require('./routes/models');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Global middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('frontend/public'));
app.use('/styles', express.static('frontend/styles'));
app.use('/js', express.static('frontend/public/js'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BookAI Open WebUI',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    model: process.env.AI_MODEL
  });
});

// API routes
app.use('/api/v1/chat', authMiddleware.optional, chatRoutes);
app.use('/api/v1/models', authMiddleware.optional, modelRoutes);

// WebSocket handling for real-time chat
io.on('connection', (socket) => {
  logger.info('New WebSocket connection established');

  socket.on('join_chat', async (data) => {
    const { chatId, userId } = data;
    socket.join(`chat:${chatId}`);
    logger.info(`User ${userId} joined chat ${chatId}`);
  });

  socket.on('leave_chat', async (data) => {
    const { chatId, userId } = data;
    socket.leave(`chat:${chatId}`);
    logger.info(`User ${userId} left chat ${chatId}`);
  });

  socket.on('disconnect', () => {
    logger.info('WebSocket connection closed');
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`BookAI server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`AI Model: ${process.env.AI_MODEL}`);
  logger.info(`WebSocket support enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing server');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io, logger };