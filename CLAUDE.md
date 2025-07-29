# BookAI Development Guidelines

## Project Overview

BookAI integrates Open WebUI with Google Vertex AI by creating a lightweight OpenAI-compatible adapter. This approach maximizes reuse of existing Open WebUI features while enabling Google Cloud AI capabilities.

## Architecture Philosophy

### Use Open WebUI, Don't Rebuild It
- Open WebUI is a mature, feature-rich platform
- We only build the adapter layer to connect it to Vertex AI
- This minimizes development time and maintenance burden

### Adapter Pattern
```
Open WebUI → OpenAI API Format → Vertex Adapter → Vertex AI API → Google Cloud
```

## Development Workflow

### 1. Working on the Vertex Adapter
The adapter is the only custom code we maintain:
- Location: `vertex-adapter/`
- Purpose: Translate OpenAI API calls to Vertex AI
- Key endpoints:
  - POST `/v1/chat/completions`
  - GET `/v1/models`
  - POST `/v1/completions` (optional)

### 2. Testing
- Unit tests for adapter endpoints
- Integration tests with real Vertex AI
- End-to-end tests with Open WebUI

### 3. Deployment
- Docker Compose orchestrates both services
- Open WebUI runs from official image
- Vertex adapter runs from custom build

## Key Implementation Details

### OpenAI API Compatibility
The adapter must handle:
```javascript
// OpenAI format (input)
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}

// Vertex AI format (output)
{
  "contents": [
    {"role": "user", "parts": [{"text": "Hello"}]}
  ]
}
```

### Streaming Support
- OpenAI uses Server-Sent Events (SSE)
- Vertex AI has its own streaming format
- Adapter must translate between them

### Error Handling
- Map Vertex AI errors to OpenAI error format
- Maintain consistent status codes
- Provide helpful error messages

## Environment Configuration

### Open WebUI Settings
```env
OPENAI_API_BASE_URL=http://vertex-adapter:8000/v1
OPENAI_API_KEY=vertex-ai-dummy-key
```

### Vertex Adapter Settings
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/app/config/service-account-key.json
AI_MODEL=gemini-2.0-flash-exp
```

## Best Practices

1. **Keep the adapter minimal** - Only implement what Open WebUI actually uses
2. **Match OpenAI behavior** - Study OpenAI API docs for exact response formats
3. **Handle edge cases** - Token limits, rate limiting, errors
4. **Log appropriately** - Help debug issues between systems
5. **Version compatibility** - Track Open WebUI version requirements

## Common Issues

### Authentication
- Vertex AI uses service account authentication
- Open WebUI expects API key authentication
- Adapter bridges this gap

### Model Names
- Open WebUI sends OpenAI model names
- Map these to appropriate Vertex AI models
- Provide configuration for custom mappings

### Feature Parity
- Not all OpenAI features exist in Vertex AI
- Document limitations clearly
- Provide graceful fallbacks

## Resources

- [Open WebUI Docs](https://docs.openwebui.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Project Repository](https://github.com/hoangvu71/BookAI)