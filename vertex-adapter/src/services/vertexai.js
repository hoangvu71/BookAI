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
      const { messages, stream = false, ...otherParams } = openaiRequest;
      
      // Convert messages to Vertex AI format
      const vertexMessages = this.convertMessages(messages);
      
      // Create chat session
      const chat = this.model.startChat({
        history: vertexMessages.slice(0, -1) // All but the last message
      });

      // Get the latest message
      const latestMessage = vertexMessages[vertexMessages.length - 1];
      
      if (stream) {
        return await this.streamResponse(chat, latestMessage.parts[0].text);
      } else {
        return await this.generateResponse(chat, latestMessage.parts[0].text);
      }
    } catch (error) {
      global.logger?.error('Vertex AI chat completion error:', error);
      throw this.mapError(error);
    }
  }

  // Generate non-streaming response
  async generateResponse(chat, message) {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.modelId,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.text()
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
  async streamResponse(chat, message) {
    const result = await chat.sendMessageStream(message);
    return result.stream;
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