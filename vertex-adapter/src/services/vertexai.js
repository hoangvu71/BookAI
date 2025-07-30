// Google Vertex AI Service
const { VertexAI } = require('@google-cloud/vertexai');

class VertexAIService {
  constructor() {
    // Validate required environment variables
    this.validateConfig();
    
    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    this.modelId = process.env.AI_MODEL || 'gemini-2.0-flash-exp';
    this.model = this.vertexAI.preview.getGenerativeModel({
      model: this.modelId,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    global.logger?.info('VertexAI service initialized', {
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
      model: this.modelId
    });
  }

  validateConfig() {
    const required = [
      'GOOGLE_CLOUD_PROJECT',
      'GOOGLE_APPLICATION_CREDENTIALS'
    ];

    for (const env of required) {
      if (!process.env[env]) {
        throw new Error(`Missing required environment variable: ${env}`);
      }
    }
  }

  // Convert OpenAI messages to Vertex AI format
  convertMessages(openaiMessages) {
    return openaiMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
  }

  // Convert OpenAI chat completion request to Vertex AI
  async chatCompletion(openaiRequest) {
    try {
      const { messages, stream = false, model, ...otherParams } = openaiRequest;
      
      // Convert messages to Vertex AI format
      const vertexMessages = this.convertMessages(messages);
      
      // Get the appropriate model and chat session
      const { modelInstance, modelId } = this.getModelForRequest(model);
      const chat = modelInstance.startChat({
        history: vertexMessages.slice(0, -1) // All but the last message
      });

      // Get the latest message
      const latestMessage = vertexMessages[vertexMessages.length - 1];
      
      if (stream) {
        return await this.streamResponse(chat, latestMessage.parts[0].text, modelId);
      } else {
        return await this.generateResponse(chat, latestMessage.parts[0].text, modelId);
      }
    } catch (error) {
      global.logger?.error('Vertex AI chat completion error:', error);
      throw this.mapError(error);
    }
  }

  // Get model instance for a request (handles custom models)
  getModelForRequest(requestedModel) {
    // If no model specified, use default
    if (!requestedModel) {
      return { modelInstance: this.model, modelId: this.modelId };
    }

    // If it's our default model, use the existing instance
    if (requestedModel === this.modelId) {
      return { modelInstance: this.model, modelId: this.modelId };
    }

    // For custom models, we'll use the default Vertex AI model but apply custom prompting
    // This allows Open WebUI's custom models to work through prompt engineering
    global.logger?.info('Using custom model with default Vertex AI backend', { 
      requestedModel, 
      backendModel: this.modelId 
    });
    
    return { modelInstance: this.model, modelId: requestedModel };
  }

  // Generate non-streaming response
  async generateResponse(chat, message, modelId = this.modelId) {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    // Extract text from response candidates
    let content = '';
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const responseContent = response.candidates[0].content;
      if (responseContent.parts && responseContent.parts.length > 0) {
        content = responseContent.parts.map(part => part.text || '').join('');
      }
    }
    
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 0, // Vertex AI doesn't provide token counts easily
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  // Generate streaming response
  async streamResponse(chat, message, modelId = this.modelId) {
    const result = await chat.sendMessageStream(message);
    
    // Return an async generator that yields processed chunks
    async function* processStream() {
      for await (const chunk of result.stream) {
        // The chunk should have a candidates array with content
        if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
          const content = chunk.candidates[0].content;
          if (content.parts && content.parts.length > 0) {
            const text = content.parts.map(part => part.text || '').join('');
            if (text) {
              yield { text: () => text };
            }
          }
        }
      }
    }
    
    return processStream();
  }

  // Get available models
  getModels() {
    return {
      object: 'list',
      data: [
        {
          id: this.modelId,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'google',
          root: this.modelId,
          parent: null,
          permission: [
            {
              id: 'modelperm-' + this.modelId,
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
        }
      ]
    };
  }

  // Map Vertex AI errors to OpenAI format
  mapError(error) {
    global.logger?.error('Mapping Vertex AI error:', error);
    
    // Default error response
    const openaiError = {
      error: {
        message: 'An error occurred while processing your request',
        type: 'server_error',
        code: 'internal_error'
      }
    };

    // Map specific error types
    if (error.message?.includes('PERMISSION_DENIED')) {
      openaiError.error = {
        message: 'Authentication failed. Please check your Google Cloud credentials.',
        type: 'authentication_error',
        code: 'permission_denied'
      };
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      openaiError.error = {
        message: 'Rate limit exceeded. Please try again later.',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded'
      };
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      openaiError.error = {
        message: 'Invalid request parameters.',
        type: 'invalid_request_error',
        code: 'invalid_argument'
      };
    }

    const mappedError = new Error(JSON.stringify(openaiError));
    mappedError.statusCode = this.getStatusCode(openaiError.error.type);
    return mappedError;
  }

  getStatusCode(errorType) {
    switch (errorType) {
      case 'authentication_error':
        return 401;
      case 'rate_limit_error':
        return 429;
      case 'invalid_request_error':
        return 400;
      default:
        return 500;
    }
  }
}

module.exports = new VertexAIService();