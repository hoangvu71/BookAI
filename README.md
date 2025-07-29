# BookAI - AI Chat Application with Vertex AI

BookAI is a custom web application that provides a chat interface powered by Google Cloud Vertex AI (Gemini 2.0 Flash) with Supabase for data persistence. While inspired by Open WebUI's features, this is a completely custom implementation built with Node.js/Express.

## Project Structure

```
BookAI/
├── backend/                 # Backend API and services
│   ├── api/                # REST API endpoints
│   ├── models/             # Data models
│   └── middleware/         # Express middleware
├── frontend/               # Frontend assets and components
│   ├── assets/            # Static assets (images, fonts)
│   ├── styles/            # CSS/SCSS stylesheets
│   └── public/            # Public files
├── src/                   # Main application source
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── services/         # API services and utilities
│   └── utils/            # Helper functions
├── config/               # Configuration files
├── docs/                # Documentation
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── scripts/            # Build and deployment scripts
├── .env               # Environment variables
└── CLAUDE.md         # Development guidelines
```

## Technology Stack

- **Frontend**: Custom HTML/CSS/JavaScript with real-time chat interface
- **Backend**: Node.js/Express REST API
- **Database**: Supabase (PostgreSQL) 
- **AI Model**: Google Cloud Vertex AI (Gemini 2.0 Flash)
- **Real-time**: Socket.io for WebSocket support
- **Session**: Redis for session management
- **Deployment**: Docker containerization

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and GitHub workflow integration.

## Current Status

🚧 **Phase 1: Foundation Setup** - In Progress
- [x] Project structure created
- [ ] Docker configuration
- [ ] Environment integration
- [ ] Database setup

See [GitHub Issues](https://github.com/hoangvu71/BookAI/issues) for detailed progress tracking.