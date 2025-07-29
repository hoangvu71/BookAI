// Google Cloud Vertex AI Configuration
const path = require('path');

// Validate required environment variables
const requiredEnvVars = [
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_CLOUD_LOCATION',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'AI_MODEL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Set Google Application Credentials path
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

// Vertex AI Configuration
const vertexAIConfig = {
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
  model: process.env.AI_MODEL,
  
  // Model-specific configurations
  models: {
    'gemini-2.0-flash-exp': {
      displayName: 'Gemini 2.0 Flash Experimental',
      contextWindow: 1048576, // 1M tokens
      maxOutputTokens: 8192,
      supportedFeatures: [
        'text-generation',
        'chat',
        'reasoning',
        'coding',
        'function-calling'
      ],
      defaultConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    }
  },

  // Safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],

  // Rate limiting configuration
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 1000000,
    concurrentRequests: 10
  }
};

// Helper function to get model config
const getModelConfig = (modelId) => {
  return vertexAIConfig.models[modelId] || vertexAIConfig.models[vertexAIConfig.model];
};

// Validate Google Cloud credentials file exists
const fs = require('fs');
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.warn(`Warning: Google Cloud credentials file not found at: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  console.warn('Please ensure the service account key file is properly configured.');
}

module.exports = {
  vertexAIConfig,
  getModelConfig
};