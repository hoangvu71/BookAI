// Open WebUI API Integration Service
const axios = require('axios');

class OpenWebUIService {
  constructor() {
    this.baseURL = process.env.OPENWEBUI_API_BASE || 'http://open-webui:8080';
    this.apiKey = process.env.OPENWEBUI_API_KEY || '0p3n-w3bu!';
    this.timeout = 5000; // 5 second timeout
    
    // Cache for custom model configurations
    this.modelCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get custom model configuration from Open WebUI
   */
  async getModelConfig(modelId) {
    try {
      // Check cache first
      const cached = this.modelCache.get(modelId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        global.logger?.debug('Using cached model config', { modelId });
        return cached.config;
      }

      global.logger?.info('Fetching custom model config from Open WebUI', { modelId });

      // Fetch all models from Open WebUI API (individual model endpoints don't exist)
      const response = await axios.get(
        `${this.baseURL}/api/v1/models/`,
        {
          timeout: this.timeout,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Find the specific model (case-insensitive)
      const models = response.data;
      const modelConfig = models.find(model => 
        model.id.toLowerCase() === modelId.toLowerCase() ||
        model.name.toLowerCase() === modelId.toLowerCase()
      );

      if (!modelConfig) {
        global.logger?.warn('Custom model not found in Open WebUI', { 
          modelId, 
          availableModels: models.map(m => ({ id: m.id, name: m.name }))
        });
        return null;
      }
      
      // Cache the configuration
      this.modelCache.set(modelId, {
        config: modelConfig,
        timestamp: Date.now()
      });

      global.logger?.info('Custom model config retrieved', { 
        modelId, 
        hasSystemPrompt: !!(modelConfig.params?.system || modelConfig.system),
        hasKnowledge: !!(modelConfig.knowledge && modelConfig.knowledge.length > 0)
      });

      return modelConfig;

    } catch (error) {
      global.logger?.warn('Failed to fetch custom model config', {
        modelId,
        error: error.message,
        status: error.response?.status
      });
      
      // Return null so we can fallback to default behavior
      return null;
    }
  }

  /**
   * Extract system prompt from model configuration
   */
  extractSystemPrompt(modelConfig) {
    if (!modelConfig) return null;
    
    // Try different possible locations for system prompt
    return modelConfig.params?.system || 
           modelConfig.system || 
           modelConfig.info?.params?.system ||
           null;
  }

  /**
   * Extract knowledge base configuration
   */
  extractKnowledgeConfig(modelConfig) {
    if (!modelConfig) return null;
    
    return modelConfig.knowledge || 
           modelConfig.meta?.knowledge ||
           modelConfig.info?.knowledge ||
           null;
  }

  /**
   * Apply custom model configuration to messages
   */
  async applyCustomModelConfig(messages, modelConfig) {
    if (!modelConfig) return messages;

    const systemPrompt = this.extractSystemPrompt(modelConfig);
    const knowledgeConfig = this.extractKnowledgeConfig(modelConfig);

    let enhancedMessages = [...messages];

    // Add system prompt as first message if it exists
    if (systemPrompt) {
      const systemMessage = {
        role: 'system',
        content: systemPrompt
      };

      // Remove any existing system messages and add our custom one
      enhancedMessages = enhancedMessages.filter(msg => msg.role !== 'system');
      enhancedMessages.unshift(systemMessage);

      global.logger?.info('Applied custom system prompt', { 
        modelId: modelConfig.id,
        systemPromptLength: systemPrompt.length 
      });
    }

    // Implement knowledge base integration
    if (knowledgeConfig && knowledgeConfig.length > 0) {
      global.logger?.info('Knowledge base detected for custom model', { 
        modelId: modelConfig.id,
        knowledgeCount: knowledgeConfig.length 
      });

      try {
        const knowledgeContent = await this.fetchKnowledgeBaseContent(knowledgeConfig);
        if (knowledgeContent) {
          // Add knowledge base content as a system message (format similar to Open WebUI)
          const knowledgeMessage = {
            role: 'system',
            content: `You have access to the following knowledge base files:\n\n${knowledgeContent}\n\nWhen using information from these files, cite them using the format [filename] at the end of relevant information.`
          };
          
          // Insert knowledge message after system prompt but before user messages
          const systemMessages = enhancedMessages.filter(msg => msg.role === 'system');
          const userMessages = enhancedMessages.filter(msg => msg.role !== 'system');
          
          enhancedMessages = [...systemMessages, knowledgeMessage, ...userMessages];
          
          global.logger?.info('Knowledge base content added to context', { 
            modelId: modelConfig.id,
            contentLength: knowledgeContent.length,
            contentPreview: knowledgeContent.substring(0, 500) + '...'
          });
        }
      } catch (error) {
        global.logger?.warn('Failed to fetch knowledge base content', {
          modelId: modelConfig.id,
          error: error.message
        });
      }
    }

    return enhancedMessages;
  }

  /**
   * Fetch knowledge base content from Open WebUI
   */
  async fetchKnowledgeBaseContent(knowledgeConfig) {
    try {
      const knowledgeCollection = knowledgeConfig[0]; // Use first knowledge base
      const collectionId = knowledgeCollection.id;

      global.logger?.info('Fetching knowledge base content', { 
        collectionId,
        collectionName: knowledgeCollection.name 
      });

      // Get knowledge collection details with files
      const response = await axios.get(
        `${this.baseURL}/api/v1/knowledge/${collectionId}`,
        {
          timeout: this.timeout,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const collection = response.data;
      const files = collection.files || [];

      if (files.length === 0) {
        global.logger?.info('No files found in knowledge collection', { collectionId });
        return null;
      }

      // Fetch content from all files in the collection
      const fileContents = [];
      for (const file of files.slice(0, 10)) { // Limit to first 10 files to avoid token limits
        try {
          const contentResponse = await axios.get(
            `${this.baseURL}/api/v1/files/${file.id}/content`,
            {
              timeout: this.timeout,
              headers: {
                'Authorization': `Bearer ${this.apiKey}`
              }
            }
          );

          const fileName = file.meta?.name || `File ${file.id}`;
          fileContents.push(`[${fileName}]\n${contentResponse.data}\n`);
          
        } catch (fileError) {
          global.logger?.warn('Failed to fetch file content', {
            fileId: file.id,
            fileName: file.meta?.name,
            error: fileError.message
          });
        }
      }

      if (fileContents.length === 0) {
        return null;
      }

      const knowledgeContent = fileContents.join('\n---\n\n');
      
      global.logger?.info('Knowledge base content fetched successfully', {
        collectionId,
        filesCount: fileContents.length,
        totalLength: knowledgeContent.length
      });

      return knowledgeContent;

    } catch (error) {
      global.logger?.error('Error fetching knowledge base content', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Clear model cache (useful for testing or when models are updated)
   */
  clearCache(modelId = null) {
    if (modelId) {
      this.modelCache.delete(modelId);
      global.logger?.info('Cleared model cache', { modelId });
    } else {
      this.modelCache.clear();
      global.logger?.info('Cleared entire model cache');
    }
  }
}

module.exports = OpenWebUIService;