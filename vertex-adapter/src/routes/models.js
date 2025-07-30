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
    let model = models.data.find(m => m.id === modelId);
    
    // If model not found in our list, create a custom model entry
    // This supports Open WebUI's custom models feature
    if (!model) {
      global.logger?.info('Creating custom model entry', { modelId });
      model = {
        id: modelId,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'custom',
        root: modelId,
        parent: null,
        permission: [
          {
            id: 'modelperm-' + modelId,
            object: 'model_permission',
            created: Math.floor(Date.now() / 1000),
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: false,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ]
      };
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