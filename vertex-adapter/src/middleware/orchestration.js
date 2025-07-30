// BookAI Orchestration Middleware - Clean, minimal integration
const axios = require('axios');

class OrchestrationMiddleware {
  constructor() {
    this.orchestratorUrl = process.env.ADK_ORCHESTRATOR_URL || 'http://adk-orchestrator:8000';
    this.enabled = process.env.ENABLE_ORCHESTRATION !== 'false';
    this.timeout = 2000; // 2 second timeout for UX
  }

  /**
   * Consult orchestrator for routing decision
   */
  async consultOrchestrator(userMessage, selectedModel) {
    // Skip if disabled
    if (!this.enabled) {
      return { should_route: false, target_model: selectedModel };
    }

    try {
      const response = await axios.post(
        `${this.orchestratorUrl}/route`,
        {
          user_message: userMessage,
          selected_model: selectedModel
        },
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data;

    } catch (error) {
      // Graceful fallback - use existing logging pattern
      global.logger?.warn('Orchestrator consultation failed, using fallback', {
        error: error.message,
        userMessage: userMessage.substring(0, 100), // Log first 100 chars
        selectedModel
      });

      return {
        should_route: false,
        target_model: selectedModel,
        reasoning: 'Orchestrator unavailable, using fallback',
        confidence: 0.0
      };
    }
  }

  /**
   * Enhance request with orchestration if needed
   */
  async enhanceRequest(req) {
    try {
      const { messages } = req.body;
      const userMessage = messages[messages.length - 1]?.content || '';
      const selectedModel = req.body.model;

      // Skip empty messages
      if (!userMessage.trim()) {
        return req;
      }

      // Consult orchestrator
      const routing = await this.consultOrchestrator(userMessage, selectedModel);

      // Apply routing decision
      if (routing.should_route && routing.target_model !== selectedModel) {
        global.logger?.info('Orchestrator routing decision', {
          from: selectedModel,
          to: routing.target_model,
          confidence: routing.confidence,
          reasoning: routing.reasoning
        });

        // Update model in request
        req.body.model = routing.target_model;

        // Add orchestration context (optional enhancement)
        if (routing.reasoning) {
          const contextMessage = {
            role: 'system',
            content: `[ORCHESTRATOR] Routed to ${routing.target_model}: ${routing.reasoning}`
          };
          req.body.messages = [contextMessage, ...messages];
        }
      }

      return req;

    } catch (error) {
      // Log error but don't fail the request
      global.logger?.error('Orchestration enhancement error', {
        error: error.message
      });
      return req;
    }
  }
}

module.exports = OrchestrationMiddleware;