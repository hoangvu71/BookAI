# BookAI - Custom Web Application with Vertex AI Integration
# Single-stage Node.js build for production deployment

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    py3-pip \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Copy environment template
COPY .env.template ./.env.template

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "src/index.js"]