FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy application code first
COPY . .

# Install Python dependencies directly
RUN pip install --no-cache-dir \
    fastapi==0.109.0 \
    uvicorn[standard]==0.27.0 \
    pydantic==2.11.7 \
    pydantic-settings==2.10.1 \
    google-generativeai==0.8.5 \
    google-cloud-aiplatform==1.103.0 \
    structlog==25.4.0 \
    prometheus-client==0.22.1 \
    python-dotenv==1.1.1

# Set environment variables
ENV PYTHONPATH=/app/src
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "bookai_adk.main:app", "--host", "0.0.0.0", "--port", "8000"]