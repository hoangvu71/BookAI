// Error Handler Middleware
const { logger } = require('../index');

const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      type: err.name || 'Error'
    }
  };

  // Add additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details || {};
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error.message = 'Validation failed';
    errorResponse.error.fields = err.errors;
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'UnauthorizedError') {
    errorResponse.error.message = 'Unauthorized access';
    return res.status(401).json(errorResponse);
  }

  if (err.code === 'PGRST116' || err.code === '42P01') {
    errorResponse.error.message = 'Database error';
    return res.status(500).json(errorResponse);
  }

  // Handle Vertex AI specific errors
  if (err.message?.includes('Vertex AI') || err.message?.includes('model')) {
    errorResponse.error.message = 'AI service error';
    errorResponse.error.details = {
      model: process.env.AI_MODEL,
      provider: 'Google Vertex AI'
    };
    return res.status(503).json(errorResponse);
  }

  // Default error response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;