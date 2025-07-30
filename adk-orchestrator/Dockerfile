FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Google ADK
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Create non-root user (following your existing pattern)
RUN addgroup --gid 1001 --system orchestrator && \
    adduser --no-create-home --shell /bin/false --disabled-password --uid 1001 --system --group orchestrator

# Change ownership
RUN chown -R orchestrator:orchestrator /app
USER orchestrator

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]