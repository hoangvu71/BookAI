// OpenAI-compatible Chat Completions API
const express = require('express');
const router = express.Router();
const vertexAI = require('../services/vertexai');
const knowledgeBase = require('../services/knowledgebase');

// POST /v1/chat/completions
router.post('/completions', async (req, res) => {
  try {
    const { messages, stream = false, model, ...otherParams } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Messages field is required and must be a non-empty array',
          type: 'invalid_request_error',
          code: 'missing_required_parameter'
        }
      });
    }

    global.logger?.info('Chat completion request', {
      messageCount: messages.length,
      stream,
      model: model || 'default'
    });

    if (stream) {
      // Handle streaming response
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      try {
        const streamResult = await vertexAI.chatCompletion({ messages, stream: true, model, ...otherParams });
        
        let fullContent = '';
        for await (const chunk of streamResult) {
          try {
            const chunkText = chunk.text();
            fullContent += chunkText;
            
            // Format as OpenAI streaming response
            const streamChunk = {
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: model || vertexAI.modelId,
              choices: [{
                index: 0,
                delta: {
                  content: chunkText
                },
                finish_reason: null
              }]
            };

            res.write(`data: ${JSON.stringify(streamChunk)}\n\n`);
          } catch (chunkError) {
            global.logger?.error('Error processing streaming chunk:', chunkError);
            // Continue with next chunk
          }
        }
        
        // Check if we should save to knowledge base BEFORE ending response
        try {
          const userMessage = messages[messages.length - 1]?.content || '';
          const kbResult = await knowledgeBase.processMessage(userMessage, fullContent);
          
          if (kbResult.shouldSave) {
            let confirmationMessage;
            if (kbResult.saveResult.success) {
              const action = kbResult.saveResult.wasAppended ? '📝 Appended to existing file in' : '✅ Saved to';
              confirmationMessage = `${action} ${kbResult.authorInfo.collection} collection`;
            } else {
              confirmationMessage = `❌ ${kbResult.saveResult.message}`;
            }
            
            // Send confirmation as additional chunk
            const confirmationChunk = {
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: model || vertexAI.modelId,
              choices: [{
                index: 0,
                delta: {
                  content: `\n\n${confirmationMessage}`
                },
                finish_reason: null
              }]
            };
            
            res.write(`data: ${JSON.stringify(confirmationChunk)}\n\n`);
          }
        } catch (kbError) {
          global.logger?.error('Knowledge base processing error:', {
            message: kbError.message
          });
          // Continue without KB functionality
        }

        // Send final chunk with finish_reason
        const finalChunk = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model || vertexAI.modelId,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }]
        };

        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();

        global.logger?.info('Streaming response completed', {
          contentLength: fullContent.length
        });

      } catch (error) {
        global.logger?.error('Streaming error:', error);
        
        const errorData = {
          error: {
            message: 'An error occurred during streaming',
            type: 'server_error'
          }
        };
        
        res.write(`data: ${JSON.stringify(errorData)}\n\n`);
        res.end();
      }

    } else {
      // Handle non-streaming response
      const result = await vertexAI.chatCompletion({ messages, stream: false, model, ...otherParams });
      
      global.logger?.info('Chat completion successful', {
        responseLength: result.choices[0]?.message?.content?.length || 0
      });

      // Check if we should save to knowledge base
      try {
        const userMessage = messages[messages.length - 1]?.content || '';
        const modelResponse = result.choices[0]?.message?.content || '';
        const kbResult = await knowledgeBase.processMessage(userMessage, modelResponse);
        
        if (kbResult.shouldSave) {
          let confirmationMessage;
          if (kbResult.saveResult.success) {
            const action = kbResult.saveResult.wasAppended ? '📝 Appended to existing file in' : '✅ Saved to';
            confirmationMessage = `${action} ${kbResult.authorInfo.collection} collection`;
          } else {
            confirmationMessage = `❌ ${kbResult.saveResult.message}`;
          }
          
          // Add confirmation to response
          result.choices[0].message.content += `\n\n${confirmationMessage}`;
        }
      } catch (kbError) {
        global.logger?.error('Knowledge base processing error:', {
          message: kbError.message
        });
        // Continue without KB functionality
      }
      
      res.json(result);
    }

  } catch (error) {
    global.logger?.error('Chat completion error:', error);
    
    // Handle mapped errors from VertexAI service
    if (error.statusCode && error.message) {
      try {
        const errorData = JSON.parse(error.message);
        return res.status(error.statusCode).json(errorData);
      } catch (parseError) {
        // Fall through to generic error
      }
    }

    // Generic error response
    res.status(500).json({
      error: {
        message: 'An error occurred while processing your request',
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

module.exports = router;