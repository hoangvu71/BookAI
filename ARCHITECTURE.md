# BookAI Architecture - Open WebUI with Vertex AI

## Overview

BookAI is a **production-ready** self-hosted AI chat interface that connects Open WebUI to Google Vertex AI through a custom OpenAI-compatible adapter. This architecture enables full access to Gemini 2.0 Flash capabilities while maintaining the familiar OpenAI API interface.

## System Architecture

```
┌─────────────────────────────────────────────┐
│           🌐 User Interface                 │
│         Open WebUI (Port 3000)             │
│   • Modern chat interface                  │
│   • Document RAG support                   │
│   • Multi-user management                  │
│   • PWA mobile support                     │
└──────────────────┬──────────────────────────┘
                   │ HTTP/WebSocket
                   │ OpenAI API Format
                   ▼
┌─────────────────────────────────────────────┐
│        🔀 Translation Layer                 │
│      Vertex AI Adapter (Port 8000)         │
│   • OpenAI → Vertex AI translation         │
│   • Streaming & non-streaming support      │
│   • Error handling & mapping               │
│   • Authentication bridge                  │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   │ Vertex AI REST API
                   ▼
┌─────────────────────────────────────────────┐
│         🧠 AI Processing                    │
│      Google Vertex AI Platform             │
│   • Gemini 2.0 Flash Experimental          │
│   • Advanced reasoning capabilities        │
│   • Multimodal support                     │
│   • Production-grade scaling               │
└─────────────────────────────────────────────┘
```

## ✅ Current Implementation Status

### 🎯 **PRODUCTION READY** - All Core Features Working

| Component | Status | Details |
|-----------|--------|---------|
| **Open WebUI** | ✅ **Production** | Official Docker image, fully configured |
| **Vertex AI Adapter** | ✅ **Production** | Custom Node.js service, tested & verified |
| **Authentication** | ✅ **Secure** | Service account key properly configured |
| **Streaming Chat** | ✅ **Working** | Real-time responses with proper SSE format |
| **Non-streaming** | ✅ **Working** | Standard request/response pattern |
| **Error Handling** | ✅ **Robust** | Proper error mapping and user feedback |

### 🏗️ Implementation Details

#### **1. Open WebUI Frontend**
- **Image**: `ghcr.io/open-webui/open-webui:main`
- **Port**: 3000 (web interface)
- **Features**: All Open WebUI capabilities enabled
- **Configuration**: Points to our custom adapter endpoint

#### **2. Vertex AI Adapter Service**
- **Language**: Node.js with Express
- **Port**: 8000 (API endpoint)
- **Endpoints Implemented**:
  ```
  ✅ GET  /health              - Service health check
  ✅ GET  /v1/models           - Available models list
  ✅ POST /v1/chat/completions - Chat functionality (streaming + non-streaming)
  ```

#### **3. Google Cloud Integration**
- **Authentication**: Service account key (`config/service-account-key.json`)
- **Project**: `writing-book-457206`
- **Location**: `us-central1`
- **Model**: `gemini-2.0-flash-exp`

### 🔧 Configuration Details

#### **Open WebUI Environment**
```bash
OPENAI_API_BASE_URL=http://vertex-adapter:8000/v1
OPENAI_API_KEY=vertex-ai-dummy-key
WEBUI_NAME=BookAI
ENABLE_RAG=true
ENABLE_SIGNUP=true
```

#### **Vertex Adapter Environment**
```bash
GOOGLE_CLOUD_PROJECT=writing-book-457206
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/app/config/service-account-key.json
AI_MODEL=gemini-2.0-flash-exp
PORT=8000
LOG_LEVEL=info
```

## 🎯 Architecture Benefits

### **1. Minimal Custom Development**
- Only the adapter layer is custom code (~200 lines)
- Open WebUI provides the entire frontend experience
- Reduces development time from months to days

### **2. Production-Grade Features** 
- **Complete UI**: Modern chat interface, dark mode, mobile support
- **User Management**: Multi-user support with authentication
- **RAG Support**: Document upload and chat functionality
- **Extensibility**: Plugin system and custom tools

### **3. Operational Excellence**
- **Container-Ready**: Full Docker Compose orchestration
- **Health Monitoring**: Built-in health checks and logging
- **Error Handling**: Proper error mapping and user feedback
- **Security**: Service account authentication with proper secret management

### **4. Future-Proof Design**
- **Model Flexibility**: Easy switching between Gemini models
- **Provider Agnostic**: Can adapt to other LLM providers
- **Open WebUI Updates**: Automatic access to new features
- **Scalable**: Ready for production deployment

## 📁 Project Structure

```
BookAI/                           # 🏠 Root directory
├── vertex-adapter/               # 🔀 Custom OpenAI→Vertex AI adapter
│   ├── src/
│   │   ├── index.js             # 🚀 Express server & middleware
│   │   ├── routes/
│   │   │   ├── chat.js          # 💬 Chat completions endpoint
│   │   │   └── models.js        # 📋 Models listing endpoint
│   │   └── services/
│   │       └── vertexai.js      # 🧠 Vertex AI integration service
│   ├── Dockerfile               # 🐳 Adapter container definition
│   ├── package.json             # 📦 Node.js dependencies
│   └── package-lock.json        # 🔒 Dependency lock file
├── config/                      # ⚙️ Configuration files
│   └── service-account-key.json # 🔐 Google Cloud credentials (gitignored)
├── docker-compose.yml           # 🐳 Service orchestration
├── .env                         # 🌍 Environment variables
├── .gitignore                   # 🚫 Version control exclusions
├── README.md                    # 📖 User documentation
├── ARCHITECTURE.md              # 🏗️ Technical architecture
├── CLAUDE.md                    # 💻 Development guidelines
└── test-adapter.js              # 🧪 Testing utilities
```

## 🐳 Docker Compose Architecture

```yaml
# Complete production setup
services:
  # Frontend: Open WebUI
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    ports: ["3000:8080"]
    environment:
      OPENAI_API_BASE_URL: http://vertex-adapter:8000/v1
      OPENAI_API_KEY: vertex-ai-dummy-key
      WEBUI_NAME: BookAI
    
  # Backend: Custom Vertex AI Adapter  
  vertex-adapter:
    build: ./vertex-adapter
    ports: ["8000:8000"]
    environment:
      GOOGLE_CLOUD_PROJECT: writing-book-457206
      AI_MODEL: gemini-2.0-flash-exp
    volumes:
      - "./config:/app/config:ro"
```

## 🔄 Data Flow

### **Chat Request Flow**
1. **User** sends message via Open WebUI interface
2. **Open WebUI** makes HTTP POST to `/v1/chat/completions`
3. **Vertex Adapter** receives OpenAI-format request
4. **Adapter** translates to Vertex AI format and authenticates
5. **Vertex AI** processes request using Gemini 2.0 Flash
6. **Adapter** translates response back to OpenAI format
7. **Open WebUI** renders streaming response to user

### **Model Information Flow**
1. **Open WebUI** requests available models via `/v1/models`
2. **Vertex Adapter** returns configured Gemini model info
3. **Open WebUI** displays model in interface dropdown

## 🚀 Deployment Ready

This architecture is **production-ready** with:
- ✅ **Tested streaming & non-streaming chat**
- ✅ **Proper error handling & logging**
- ✅ **Secure credential management**
- ✅ **Health monitoring endpoints**
- ✅ **Container orchestration**
- ✅ **Documentation & troubleshooting guides**