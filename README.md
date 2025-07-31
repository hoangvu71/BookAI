# BookAI - Open WebUI with OpenRouter

**Production-ready AI chat interface powered by OpenRouter and Open WebUI** ✨

BookAI provides a self-hosted AI chat interface using Open WebUI connected to OpenRouter, giving you access to multiple AI models through a single API.

## 🚀 Features

- **✅ Multiple AI Models** - Access to GPT-4, Claude, Gemini, Llama, and more through OpenRouter
- **🤖 Modern Interface** - Open WebUI's polished chat experience
- **🔒 Privacy-First** - Self-hosted interface with your own API credentials
- **⚡ High Performance** - Direct integration with OpenRouter's optimized API
- **📱 Mobile Ready** - Progressive Web App support
- **🌐 Multi-language** - International interface support
- **💾 RAG Support** - Built-in document chat and knowledge base features

## 🏗️ Architecture

```
Open WebUI (Port 3000) → OpenRouter API → Multiple AI Providers
```

Direct integration with OpenRouter's OpenAI-compatible API enables access to multiple AI models.

## 📋 Prerequisites

- **Docker & Docker Compose** - For containerized deployment
- **OpenRouter Account** - Sign up at [openrouter.ai](https://openrouter.ai)
- **OpenRouter API Key** - Generate from your OpenRouter dashboard

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

### Available Models
- `gemini-2.0-flash-exp` - Latest experimental model (recommended)
- `gemini-1.5-pro` - Production stable model
- `gemini-1.5-flash` - Fast, efficient model

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