// OpenAI-compatible Models API
const express = require('express');
const router = express.Router();
const vertexAI = require('../services/vertexai');

// GET /v1/models
router.get('/', (req, res) => {
  try {
    global.logger?.info('Models list requested');
    
    const models = vertexAI.getModels();
    res.json(models);
    
  } catch (error) {
    global.logger?.error('Error fetching models:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch available models',
        type: 'server_error',
        code: 'models_fetch_error'
      }
    });
  }
});

// GET /v1/models/{model_id}
router.get('/:modelId', (req, res) => {
  try {
    const { modelId } = req.params;
    
    global.logger?.info('Model details requested', { modelId });
    
    const models = vertexAI.getModels();
    const model = models.data.find(m => m.id === modelId);
    
    if (!model) {
      return res.status(404).json({
        error: {
          message: `Model '${modelId}' not found`,
          type: 'invalid_request_error',
          code: 'model_not_found'
        }
      });
    }
    
    res.json(model);
    
  } catch (error) {
    global.logger?.error('Error fetching model details:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to fetch model details',
        type: 'server_error',
        code: 'model_fetch_error'
      }
    });
  }
});

module.exports = router;