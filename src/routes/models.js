// Models API Routes
const express = require('express');
const router = express.Router();
const { db } = require('../../config/supabase');
const vertexAIService = require('../services/vertexai');

// Get available models
router.get('/', async (req, res, next) => {
  try {
    // Get models from database
    const { data: dbModels, error } = await db.supabase
      .from('models')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Get current model info from Vertex AI
    const currentModel = vertexAIService.getModelInfo();

    // Combine database models with current active model
    const models = dbModels.map(model => ({
      ...model,
      is_current: model.id === currentModel.id
    }));

    res.json({
      success: true,
      models: models,
      current: currentModel
    });
  } catch (error) {
    next(error);
  }
});

// Get specific model details
router.get('/:modelId', async (req, res, next) => {
  try {
    const { modelId } = req.params;

    if (modelId === process.env.AI_MODEL) {
      // Return current Vertex AI model info
      const modelInfo = vertexAIService.getModelInfo();
      res.json({
        success: true,
        model: modelInfo
      });
    } else {
      // Get from database
      const { data: model, error } = await db.supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (error || !model) {
        return res.status(404).json({
          success: false,
          error: 'Model not found'
        });
      }

      res.json({
        success: true,
        model: model
      });
    }
  } catch (error) {
    next(error);
  }
});

// Test model connection
router.post('/:modelId/test', async (req, res, next) => {
  try {
    const { modelId } = req.params;
    const { testPrompt = 'Hello, please respond with "Model test successful"' } = req.body;

    if (modelId !== process.env.AI_MODEL) {
      return res.status(400).json({
        success: false,
        error: 'Can only test the currently configured model'
      });
    }

    // Test the model
    const startTime = Date.now();
    const response = await vertexAIService.generateContent(testPrompt);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      test: {
        model: modelId,
        prompt: testPrompt,
        response: response.text,
        responseTime: `${responseTime}ms`,
        metadata: response.metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Model test failed',
      details: error.message
    });
  }
});

// Get model capabilities
router.get('/:modelId/capabilities', async (req, res, next) => {
  try {
    const { modelId } = req.params;

    if (modelId === process.env.AI_MODEL) {
      const modelInfo = vertexAIService.getModelInfo();
      res.json({
        success: true,
        capabilities: {
          id: modelInfo.id,
          name: modelInfo.name,
          features: modelInfo.capabilities,
          limits: modelInfo.limits,
          configuration: modelInfo.config
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Model not found or not active'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;