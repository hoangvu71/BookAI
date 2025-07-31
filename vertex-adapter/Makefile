.PHONY: dev install test lint format clean docker-build docker-run

# Development
dev:
	@echo "🚀 Starting development server..."
	poetry run uvicorn bookai_adk.main:app --reload --host 0.0.0.0 --port 8000

install:
	@echo "📦 Installing dependencies..."
	poetry install

# Testing
test:
	@echo "🧪 Running tests..."
	poetry run pytest -v

test-watch:
	@echo "👀 Running tests in watch mode..."
	poetry run pytest-watch

# Code Quality
lint:
	@echo "🔍 Linting code..."
	poetry run ruff check .
	poetry run mypy src/

format:
	@echo "✨ Formatting code..."
	poetry run black .
	poetry run isort .

# ADK specific
adk-doctor:
	@echo "🩺 Running ADK doctor..."
	poetry run python -c "import google.generativeai as genai; print('✅ Google ADK dependencies OK')"

# Docker
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t bookai-adk-service .

docker-run:
	@echo "🐳 Running Docker container..."
	docker run -p 8000:8000 --env-file .env bookai-adk-service

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .mypy_cache .ruff_cache