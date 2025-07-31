# BookAI - Multi-Agent AI Orchestrator with Open WebUI

**Production-ready multi-agent AI system with intelligent routing powered by Google Vertex AI** ✨

BookAI provides a self-hosted AI chat interface using Open WebUI connected to multiple specialized AI agents through an intelligent orchestration layer that automatically routes queries to the most appropriate expert agent.

## 🚀 Features

- **🧠 Intelligent Multi-Agent System** - Automatically routes queries to specialized agents
- **🎯 Domain Expertise** - Dedicated agents for finance, coding, and more domains
- **🔀 Multi-Domain Support** - Handles queries spanning multiple domains with combined responses
- **✅ Full Chat Functionality** - Both streaming and non-streaming responses
- **🤖 Vertex AI Powered** - Uses Gemini models for both routing and agent responses
- **🔒 Privacy-First** - Self-hosted with your own Google Cloud credentials
- **⚡ High Performance** - Optimized routing with fallback mechanisms
- **📱 Mobile Ready** - Progressive Web App support
- **🌐 Multi-language** - International interface support

## 🏗️ Architecture

```
Open WebUI (Port 3000) 
    ↓
Orchestrator with LLM Router (Port 8000)
    ↓
┌─────────────┬─────────────┬──────────────┐
│FinanceAgent│ CodeAgent   │ Future Agents│
└─────────────┴─────────────┴──────────────┘
    ↓
Google Vertex AI (Gemini Models)
```

The orchestrator uses intelligent routing to direct queries to specialized agents based on content analysis.

## 📋 Prerequisites

- **Docker & Docker Compose** - For containerized deployment
- **Google Cloud Project** - With Vertex AI API enabled
- **Service Account** - With Vertex AI User permissions

## ⚡ Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/hoangvu71/BookAI.git
cd BookAI
```

### 2. Google Cloud Authentication

**Create a service account:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin → Service Accounts
3. Create a new service account with "Vertex AI User" role
4. Generate and download the JSON key file

**Add the service account key:**
```bash
# Place your service account JSON key file
cp /path/to/your-service-account-key.json config/service-account-key.json
```

### 3. Configure Environment
The `.env` file is already configured for your Google Cloud project:
```bash
# Current configuration:
GOOGLE_CLOUD_PROJECT=writing-book-457206
GOOGLE_CLOUD_LOCATION=us-central1
AI_MODEL=gemini-2.0-flash-exp
```

### 4. Start Services
```bash
docker-compose up -d
```

### 5. Access Application
- **Main Interface**: http://localhost:3000
- **API Health Check**: http://localhost:8000/health

## 🎯 Usage Examples

### Multi-Domain Query
When you ask "How do I build a Python trading bot?", the system:
1. Detects this spans both coding and finance domains
2. Routes to both CodeAgent and FinanceAgent
3. Combines responses to provide technical implementation + financial considerations

### Direct Agent Access
You can also select specific agents in Open WebUI:
- Choose `finance-agent` for dedicated financial advice
- Choose `code-agent` for programming help
- Choose `bookai-general` for intelligent routing

## ✅ Verification

Test the setup with these curl commands:

**Health check:**
```bash
curl http://localhost:8000/health
```

**Non-streaming chat:**
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"stream":false}'
```

**Streaming chat:**
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Count to 3"}],"stream":true}' \
  --no-buffer
```

## 🔧 Advanced Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLOUD_PROJECT` | Your GCP project ID | `writing-book-457206` |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI location | `us-central1` |
| `AI_MODEL` | Gemini model to use | `gemini-2.0-flash-exp` |
| `WEBUI_SECRET_KEY` | Open WebUI secret key | `bookai-secret-key-2025` |
| `ENABLE_RAG` | Enable document chat | `true` |

### Available Models in Open WebUI
- `bookai-general` - Intelligent orchestrator that routes to appropriate agents
- `finance-agent` - Direct access to financial advisor agent
- `code-agent` - Direct access to programming assistant agent

### Available Agents
- **FinanceAgent** - Specializes in investment advice, portfolio management, retirement planning
- **CodeAgent** - Specializes in programming, algorithms, debugging, and software architecture
- More agents can be easily added by extending the base agent class

## 🛠️ Troubleshooting

### Common Issues

**❌ "An error occurred during streaming"**
- **Cause**: Missing or invalid service account key
- **Solution**: Ensure `config/service-account-key.json` exists and is valid

**❌ Adapter container fails to start**
- **Cause**: Missing Google Cloud credentials
- **Solution**: Check service account has "Vertex AI User" role

**❌ Open WebUI shows "No models available"**
- **Cause**: Adapter not accessible from Open WebUI
- **Solution**: Verify both containers are running: `docker-compose ps`

### Debug Commands
```bash
# Check container status
docker-compose ps

# View adapter logs
docker-compose logs vertex-adapter

# View Open WebUI logs  
docker-compose logs open-webui

# Test adapter health
curl http://localhost:8000/health

# Test available models
curl http://localhost:8000/v1/models
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and architecture philosophy
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed technical architecture
- **[Open WebUI Docs](https://docs.openwebui.com/)** - Frontend documentation
- **[Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)** - Google Cloud AI platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Open WebUI](https://github.com/open-webui/open-webui)** - Outstanding frontend interface
- **[Google Vertex AI](https://cloud.google.com/vertex-ai)** - Powerful AI platform
- **[Gemini Models](https://ai.google.dev/models/gemini)** - State-of-the-art language models