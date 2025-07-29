# BookAI - Open WebUI with Google Vertex AI

BookAI provides a self-hosted AI chat interface using Open WebUI connected to Google Vertex AI (Gemini 2.0 Flash) through a custom OpenAI-compatible adapter.

## Overview

This project enables you to:
- Use Open WebUI's feature-rich interface
- Connect to Google Vertex AI instead of OpenAI
- Maintain data privacy with self-hosted deployment
- Access Gemini 2.0 Flash's capabilities through a familiar interface

## Architecture

```
Open WebUI (Frontend) → Vertex AI Adapter → Google Vertex AI
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Cloud Project with Vertex AI enabled
- Service account key with Vertex AI permissions

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hoangvu71/BookAI.git
cd BookAI
```

2. Configure environment:
```bash
cp .env.template .env
# Edit .env with your Google Cloud settings
```

3. Add your Google Cloud service account key:
```bash
cp /path/to/your/service-account-key.json config/service-account-key.json
```

4. Start the services:
```bash
docker-compose up -d
```

5. Access Open WebUI at http://localhost:3000

## Features

All Open WebUI features are available:
- 🤖 Modern chat interface
- 📚 Document chat with RAG
- 🔍 Web search integration
- 👥 Multi-user support
- 🎨 Image generation support
- 📱 Mobile-friendly PWA
- 🌐 Multilingual interface

## Configuration

Key environment variables in `.env`:
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
- `GOOGLE_CLOUD_LOCATION` - Vertex AI location (e.g., us-central1)
- `AI_MODEL` - Model to use (default: gemini-2.0-flash-exp)

## Development

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

## License

MIT License - See LICENSE file for details.