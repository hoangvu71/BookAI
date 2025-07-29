// Vertex AI Integration Service
const { VertexAI } = require('@google-cloud/vertexai');
const { logger } = require('../index');

// Initialize Vertex AI with project configuration
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
});

// Model configuration
const modelConfig = {
  model: process.env.AI_MODEL || 'gemini-2.0-flash-exp',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
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
};

// Get generative model instance
const generativeModel = vertexAI.preview.getGenerativeModel(modelConfig);

// Service class for Vertex AI operations
class VertexAIService {
  constructor() {
    this.model = generativeModel;
    this.activeChats = new Map(); // Store chat sessions
  }

  // Start a new chat session
  async startChat(chatId, systemPrompt = null) {
    try {
      const chatSession = this.model.startChat({
        history: [],
        generationConfig: modelConfig.generationConfig,
      });

      // Add system prompt if provided
      if (systemPrompt) {
        await chatSession.sendMessage(`System: ${systemPrompt}`);
      }

      this.activeChats.set(chatId, chatSession);
      return chatSession;
    } catch (error) {
      logger.error('Error starting chat session:', error);
      throw new Error('Failed to start chat session');
    }
  }

  // Send message to existing chat
  async sendMessage(chatId, message, streamCallback = null) {
    try {
      let chatSession = this.activeChats.get(chatId);
      
      if (!chatSession) {
        chatSession = await this.startChat(chatId);
      }

      // Handle streaming responses
      if (streamCallback && typeof streamCallback === 'function') {
        const result = await chatSession.sendMessageStream(message);
        
        let fullResponse = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          streamCallback(chunkText);
        }
        
        return {
          text: fullResponse,
          chatId: chatId
        };
      }

      // Non-streaming response
      const result = await chatSession.sendMessage(message);
      const response = await result.response;
      
      return {
        text: response.text(),
        chatId: chatId
      };
    } catch (error) {
      logger.error('Error sending message:', error);
      throw new Error('Failed to send message to AI model');
    }
  }

  // Generate content without chat context
  async generateContent(prompt, options = {}) {
    try {
      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: options.generationConfig || modelConfig.generationConfig,
        safetySettings: options.safetySettings || modelConfig.safetySettings,
      };

      const result = await this.model.generateContent(request);
      const response = await result.response;
      
      return {
        text: response.text(),
        metadata: {
          model: modelConfig.model,
          promptTokenCount: result.promptTokenCount,
          candidatesTokenCount: result.candidatesTokenCount,
        }
      };
    } catch (error) {
      logger.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  // Clear chat session
  clearChat(chatId) {
    if (this.activeChats.has(chatId)) {
      this.activeChats.delete(chatId);
      return true;
    }
    return false;
  }

  // Get model information
  getModelInfo() {
    return {
      id: modelConfig.model,
      name: 'Gemini 2.0 Flash Experimental',
      provider: 'Google Vertex AI',
      capabilities: ['text-generation', 'chat', 'reasoning', 'coding'],
      limits: {
        maxTokens: 8192,
        contextWindow: 1048576, // 1M tokens for Gemini 2.0 Flash
      },
      config: modelConfig.generationConfig
    };
  }

  // Validate and prepare messages for Open WebUI format
  formatForOpenWebUI(response) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response.text,
      model: modelConfig.model,
      created_at: new Date().toISOString(),
      metadata: response.metadata || {}
    };
  }
}

// Export singleton instance
module.exports = new VertexAIService();