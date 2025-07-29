// Chat API Routes
const express = require('express');
const router = express.Router();
const { db } = require('../../config/supabase');
const vertexAIService = require('../services/vertexai');
const { logger } = require('../index');

// Create new chat
router.post('/new', async (req, res, next) => {
  try {
    const { title, userId } = req.body;
    
    // Create chat in database
    const chat = await db.createChat({
      user_id: userId || 'anonymous',
      title: title || 'New Chat',
      model_id: process.env.AI_MODEL,
      chat_data: {},
      tags: []
    });

    // Initialize chat session with Vertex AI
    await vertexAIService.startChat(chat.id);

    res.json({
      success: true,
      chat: chat
    });
  } catch (error) {
    next(error);
  }
});

// Get user's chats
router.get('/list', async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    const chats = await db.getChatsByUserId(userId || 'anonymous');
    
    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    next(error);
  }
});

// Get chat by ID with messages
router.get('/:chatId', async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    const chat = await db.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    const messages = await db.getMessagesByChatId(chatId);
    
    res.json({
      success: true,
      chat: chat,
      messages: messages
    });
  } catch (error) {
    next(error);
  }
});

// Send message to chat
router.post('/:chatId/message', async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { message, userId, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Save user message to database
    const userMessage = await db.createMessage({
      chat_id: chatId,
      user_id: userId || 'anonymous',
      role: 'user',
      content: message,
      model_id: process.env.AI_MODEL
    });

    // Get response from Vertex AI
    if (stream) {
      // Set up SSE for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';
      
      const response = await vertexAIService.sendMessage(chatId, message, (chunk) => {
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ chunk: chunk })}\n\n`);
        fullResponse += chunk;
      });

      // Save assistant message to database
      const assistantMessage = await db.createMessage({
        chat_id: chatId,
        user_id: 'assistant',
        role: 'assistant',
        content: fullResponse,
        model_id: process.env.AI_MODEL,
        metadata: { streamed: true }
      });

      // Send final message
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        message: assistantMessage 
      })}\n\n`);
      
      res.end();
    } else {
      // Non-streaming response
      const response = await vertexAIService.sendMessage(chatId, message);
      
      // Save assistant message to database
      const assistantMessage = await db.createMessage({
        chat_id: chatId,
        user_id: 'assistant',
        role: 'assistant',
        content: response.text,
        model_id: process.env.AI_MODEL
      });

      // Format response for Open WebUI compatibility
      const formattedResponse = vertexAIService.formatForOpenWebUI({
        text: response.text,
        metadata: { chatId }
      });

      res.json({
        success: true,
        userMessage: userMessage,
        assistantMessage: formattedResponse
      });
    }

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('new_message', {
        chatId: chatId,
        message: userMessage
      });
    }

  } catch (error) {
    next(error);
  }
});

// Delete chat
router.delete('/:chatId', async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    // Clear from Vertex AI service
    vertexAIService.clearChat(chatId);
    
    // Delete from database (messages will cascade delete)
    await db.supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Generate completion (without chat context)
router.post('/generate', async (req, res, next) => {
  try {
    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const response = await vertexAIService.generateContent(prompt, options);
    
    res.json({
      success: true,
      response: response
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;