# Multi-stage optimized Dockerfile for backend services
# This version uses layer caching to dramatically speed up builds

FROM python:3.11-slim as base

WORKDIR /app

# Install system dependencies (cached layer)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies stage (heavily cached)
# ============================================
FROM base as dependencies

# Copy ONLY requirements first (this layer is cached unless requirements change)
COPY requirements.txt .

# Install Python dependencies with caching
# This is the slow step, but it's cached if requirements.txt doesn't change
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install -r requirements.txt

# ============================================
# Development stage
# ============================================
FROM dependencies as development

# Copy shared code
COPY shared/ /app/shared/

# Copy services code
COPY services/ /app/services/

# Copy migrations
COPY migrations/ /app/migrations/
COPY alembic.ini /app/

# Set Python path
ENV PYTHONPATH=/app

# Expose port (will be overridden by docker-compose)
EXPOSE 8000

# Default command (will be overridden by docker-compose)
CMD ["uvicorn", "services.gateway.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
