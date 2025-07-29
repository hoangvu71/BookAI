# BookAI - Open WebUI Integration
# Multi-stage Docker build for production deployment

# Stage 1: Base Open WebUI image
FROM ghcr.io/open-webui/open-webui:main as openwebui-base

# Stage 2: Custom configuration and integration
FROM node:18-alpine as app-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY config/ ./config/

# Build the application
RUN npm run build

# Stage 3: Final production image
FROM openwebui-base

# Install additional dependencies for our integrations
RUN pip install --no-cache-dir \
    google-cloud-aiplatform \
    supabase \
    python-dotenv

# Copy our custom integration files
COPY --from=app-builder /app/dist /app/custom
COPY --from=app-builder /app/config /app/config

# Copy environment template
COPY .env.template /app/.env.template

# Create data directory for persistence
RUN mkdir -p /app/backend/data

# Set environment variables
ENV WEBUI_SECRET_KEY=""
ENV OPENAI_API_BASE_URL=""
ENV DATABASE_URL=""
ENV SUPABASE_URL=""
ENV SUPABASE_ANON_KEY=""
ENV GOOGLE_CLOUD_PROJECT=""
ENV GOOGLE_CLOUD_LOCATION=""

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start command
CMD ["bash", "start.sh"]