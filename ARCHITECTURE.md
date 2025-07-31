# BookAI Architecture Documentation

## Overview

BookAI is a multi-agent AI orchestration system that intelligently routes user queries to specialized AI agents. The system combines Open WebUI's user interface with a custom orchestration layer that leverages Google Vertex AI for both routing decisions and agent responses.

## System Components

### 1. Open WebUI (Frontend)
- **Purpose**: Provides the chat interface for users
- **Port**: 3000
- **Features**: 
  - Multi-model selection
  - Streaming chat support
  - Conversation history
  - User authentication

### 2. Vertex Adapter (Orchestration Layer)
- **Purpose**: Routes queries to appropriate agents and translates between OpenAI and Vertex AI formats
- **Port**: 8000
- **Components**:
  - FastAPI server
  - LLM Router (Vertex AI powered)
  - Agent Orchestrator
  - OpenAI-compatible API endpoints

### 3. Specialized Agents
- **FinanceAgent**: Investment, portfolio management, financial planning
- **CodeAgent**: Programming, debugging, software architecture
- **Base Agent Class**: Extensible framework for adding new agents

### 4. Google Vertex AI
- **Routing Model**: Gemini 1.5 Flash (for query analysis)
- **Agent Model**: Gemini 2.0 Flash Experimental (for responses)
- **Authentication**: Service account with JSON key

## Data Flow

### Single Domain Query
```
1. User submits query in Open WebUI
2. Open WebUI sends OpenAI-format request to adapter
3. LLM Router analyzes query using Vertex AI
4. Router determines appropriate agent
5. Agent processes query using Vertex AI
6. Response streams back to user
```

### Multi-Domain Query
```
1. User submits complex query
2. LLM Router detects multiple relevant domains
3. Query sent to primary agent (highest confidence)
4. Query also sent to secondary agents
5. Responses combined with clear sections
6. Unified response returned to user
```

## Key Design Decisions

### 1. OpenAI API Compatibility
- Allows Open WebUI to work without modifications
- Standard API format for easy integration
- Supports both streaming and non-streaming modes

### 2. Intelligent Routing
- Uses LLM for semantic understanding
- Fallback to keyword matching if needed
- Confidence scoring for routing decisions

### 3. Agent Isolation
- Each agent operates independently
- No shared memory between agents (currently)
- Clean separation of concerns

### 4. Extensibility
- Easy to add new agents
- Base agent class provides common functionality
- Modular architecture

## Configuration

### Environment Variables
```env
# Google Cloud Settings
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=config/service-account-key.json

# Model Selection
AI_MODEL=gemini-2.0-flash-exp

# Optional: For enhanced routing
GOOGLE_API_KEY=your-api-key  # Not required if using service account
```

### Agent Registration
Agents are registered in the orchestrator:
```python
self.agents = {
    "finance": FinanceAgent(),
    "code": CodeAgent(),
    # Add new agents here
}
```

## API Endpoints

### OpenAI-Compatible Endpoints
- `POST /v1/chat/completions` - Main chat endpoint
- `GET /v1/models` - List available models
- `GET /health` - Health check

### Routing Analysis Endpoints
- `POST /routing/analyze` - Analyze query routing
- `GET /routing/stats` - Routing statistics
- `GET /routing/test` - Test routing examples

## Security Considerations

1. **Authentication**: Service account for Vertex AI
2. **Network**: Internal Docker network for service communication
3. **Secrets**: Service account key mounted as volume
4. **CORS**: Configured for Open WebUI access

## Performance Optimizations

1. **Streaming Responses**: Reduces perceived latency
2. **Async Processing**: Non-blocking agent calls
3. **Connection Pooling**: Reused Vertex AI connections
4. **Minimal Overhead**: Direct API translation

## Future Enhancements

1. **Agent Memory**: Share context between agents
2. **Custom Models**: Support for fine-tuned models
3. **More Agents**: Legal, medical, creative writing
4. **Analytics**: Query patterns and agent performance
5. **Caching**: Response caching for common queries