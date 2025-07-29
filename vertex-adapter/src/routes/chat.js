// OpenAI-compatible Chat Completions API
const express = require('express');
const router = express.Router();
const vertexAI = require('../services/vertexai');

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
        const streamResult = await vertexAI.chatCompletion({ messages, stream: true, ...otherParams });
        
        let fullContent = '';
        for await (const chunk of streamResult) {
          const chunkText = chunk.text();
          fullContent += chunkText;
          
          // Format as OpenAI streaming response
          const streamChunk = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: vertexAI.modelId,
            choices: [{
              index: 0,
              delta: {
                content: chunkText
              },
              finish_reason: null
            }]
          };

          res.write(`data: ${JSON.stringify(streamChunk)}\n\n`);
        }

        // Send final chunk with finish_reason
        const finalChunk = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: vertexAI.modelId,
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
      const result = await vertexAI.chatCompletion({ messages, stream: false, ...otherParams });
      
      global.logger?.info('Chat completion successful', {
        responseLength: result.choices[0]?.message?.content?.length || 0
      });
      
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