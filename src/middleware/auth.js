// Authentication Middleware
const jwt = require('jsonwebtoken');
const { db } = require('../../config/supabase');
const { logger } = require('../index');

// Verify JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Required authentication middleware
const required = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get user from database
    const user = await db.getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Optional authentication middleware
const optional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (decoded) {
        const user = await db.getUserById(decoded.userId);
        if (user && user.is_active) {
          req.user = user;
        }
      }
    }

    // Continue regardless of authentication status
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Continue without user
    next();
  }
};

// Role-based access control
const requireRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// API key authentication (for programmatic access)
const apiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // In a real implementation, validate API key from database
    // For now, we'll use a simple environment variable check
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    logger.error('API key auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

module.exports = {
  required,
  optional,
  requireRole,
  apiKey,
  verifyToken
};