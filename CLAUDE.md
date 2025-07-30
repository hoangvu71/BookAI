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

# Knowledge Base Integration
OPENWEBUI_API_BASE=http://open-webui:8080
OPENWEBUI_API_KEY=your-openwebui-api-key
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

## Knowledge Base Integration

BookAI includes automatic knowledge base integration for author generation. When using custom models, the system can automatically detect author creation requests and save the generated content to Open WebUI's Knowledge Base.

### How It Works

1. **Pattern Detection**: The adapter detects messages containing author creation patterns:
   - "Create author for the [genre] genre for the [collection] collection"
   - "Generate [genre] author for [collection]"
   - "Make [genre] author for [collection]"

2. **Content Processing**: When a pattern is detected:
   - Extracts genre and target collection from the user message
   - Processes the AI-generated author profile
   - Creates a properly formatted filename (e.g., "History Sci-fi Author Profile.txt")

3. **Knowledge Base Storage**: 
   - Uploads the content as a text file to Open WebUI
   - Automatically adds it to the specified knowledge collection
   - Provides user feedback via confirmation messages

### Configuration

Ensure these environment variables are set for knowledge base integration:

```env
# Knowledge Base API Configuration
OPENWEBUI_API_BASE=http://open-webui:8080
OPENWEBUI_API_KEY=your-openwebui-api-key
```

### Usage Example

When you send a message like:
```
"Create author for the History Sci-fi genre for the Authors collection"
```

The system will:
1. Generate an author profile using Vertex AI
2. Save it as "History Sci-fi Author Profile.txt"
3. Add it to the "Authors" knowledge collection
4. Display a confirmation message: "✅ Saved to Authors collection"

### Implementation Details

- **Location**: `vertex-adapter/src/services/knowledgebase.js`
- **Integration Point**: Chat completions endpoint (both streaming and non-streaming)
- **Error Handling**: Graceful fallback if knowledge base operations fail
- **Collection Management**: Automatically finds existing collections or uses the first available one

## Resources

- [Open WebUI Docs](https://docs.openwebui.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Project Repository](https://github.com/hoangvu71/BookAI)