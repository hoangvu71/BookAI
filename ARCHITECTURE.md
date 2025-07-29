# BookAI Architecture - Open WebUI with Vertex AI

## Overview

BookAI uses Open WebUI as the frontend interface and connects it to Google Vertex AI (Gemini 2.0 Flash) through an OpenAI-compatible adapter layer.

## Architecture Components

```
┌─────────────────────┐
│   Open WebUI        │  ← User Interface (existing Open WebUI)
│   (Frontend)        │
└──────────┬──────────┘
           │ OpenAI API format
           ▼
┌─────────────────────┐
│  Vertex AI Adapter  │  ← Custom adapter (what we build)
│  (OpenAI → Vertex)  │
└──────────┬──────────┘
           │ Vertex AI API
           ▼
┌─────────────────────┐
│  Google Vertex AI   │  ← LLM Provider
│  (Gemini 2.0 Flash) │
└─────────────────────┘
```

## Implementation Approach

### 1. Use Open WebUI As-Is
- Deploy Open WebUI using their official Docker image
- Configure it to point to our custom OpenAI-compatible endpoint
- Leverage all existing Open WebUI features (chat, RAG, user management, etc.)

### 2. Build Vertex AI Adapter
- Create a lightweight service that translates OpenAI API calls to Vertex AI
- Implement only the necessary endpoints:
  - `/v1/chat/completions` - For chat functionality
  - `/v1/models` - To list available models
  - `/v1/completions` - For text completion (if needed)

### 3. Configuration
- Open WebUI environment variables:
  ```
  OPENAI_API_BASE_URL=http://vertex-adapter:8000/v1
  OPENAI_API_KEY=dummy-key-for-vertex
  ```
- Vertex AI adapter configuration:
  ```
  GOOGLE_CLOUD_PROJECT=your-project
  GOOGLE_CLOUD_LOCATION=us-central1
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
  AI_MODEL=gemini-2.0-flash-exp
  ```

## Benefits of This Approach

1. **Minimal Development**: Only build the adapter, not a full application
2. **Full Feature Set**: Get all Open WebUI features without reimplementing
3. **Maintainability**: Updates to Open WebUI are automatic
4. **Flexibility**: Can easily switch between LLM providers
5. **Time Efficiency**: Significantly reduces development time

## Directory Structure

```
BookAI/
├── vertex-adapter/          # Our custom Vertex AI adapter
│   ├── src/
│   │   ├── index.js        # Main server
│   │   ├── routes/         # OpenAI-compatible endpoints
│   │   └── services/       # Vertex AI integration
│   ├── Dockerfile
│   └── package.json
├── config/                  # Configuration files
│   └── service-account.json # Google Cloud credentials
├── docker-compose.yml       # Orchestrates Open WebUI + adapter
├── .env                     # Environment variables
└── README.md               # Documentation
```

## Docker Compose Setup

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    environment:
      - OPENAI_API_BASE_URL=http://vertex-adapter:8000/v1
      - OPENAI_API_KEY=dummy-key
    
  vertex-adapter:
    build: ./vertex-adapter
    environment:
      - GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}
      - AI_MODEL=${AI_MODEL}
```

This architecture provides the simplest path to get Open WebUI working with Vertex AI while maintaining all its features.