.PHONY: help dev prod stop clean logs migrate seed test shell db-shell redis-cli es-health

# Default target
help:
	@echo "CRM System - Docker Commands"
	@echo "============================"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start all services in development mode"
	@echo "  make stop         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View logs from all services"
	@echo "  make logs-f       - Follow logs from all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make migrate-down - Rollback last migration"
	@echo "  make seed         - Seed database with sample data"
	@echo "  make db-shell     - Open PostgreSQL shell"
	@echo "  make db-reset     - Reset database (WARNING: destroys all data)"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-unit    - Run unit tests only"
	@echo "  make test-int     - Run integration tests only"
	@echo "  make test-cov     - Run tests with coverage report"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell        - Open shell in gateway container"
	@echo "  make redis-cli    - Open Redis CLI"
	@echo "  make es-health    - Check Elasticsearch health"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make ps           - Show running containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start services in production mode"
	@echo "  make build        - Build all Docker images"

# =============================================================================
# Development Commands
# =============================================================================

dev:
	@echo "Starting CRM system in development mode..."
	@docker-compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ Services started!"
	@echo ""
	@echo "Access points:"
	@echo "  - API Gateway:    http://localhost:8000"
	@echo "  - Frontend:       http://localhost:3000"
	@echo "  - Mailhog UI:     http://localhost:8025"
	@echo "  - Elasticsearch:  http://localhost:9200"
	@echo ""
	@echo "Run 'make logs-f' to follow logs"
	@echo "Run 'make migrate' to apply database migrations"

stop:
	@echo "Stopping all services..."
	@docker-compose -f docker-compose.dev.yml down

restart:
	@echo "Restarting all services..."
	@docker-compose -f docker-compose.dev.yml restart

logs:
	@docker-compose -f docker-compose.dev.yml logs

logs-f:
	@docker-compose -f docker-compose.dev.yml logs -f

ps:
	@docker-compose -f docker-compose.dev.yml ps

# =============================================================================
# Database Commands
# =============================================================================

migrate:
	@echo "Running database migrations..."
	@docker-compose -f docker-compose.dev.yml run --rm migrate
	@echo "✅ Migrations complete!"

migrate-down:
	@echo "Rolling back last migration..."
	@docker-compose -f docker-compose.dev.yml run --rm migrate alembic downgrade -1

migrate-create:
	@read -p "Enter migration name: " name; \
	docker-compose -f docker-compose.dev.yml run --rm migrate alembic revision --autogenerate -m "$$name"

seed:
	@echo "Seeding database with sample data..."
	@docker-compose -f docker-compose.dev.yml run --rm gateway python scripts/seed_data.py
	@echo "✅ Database seeded!"

db-shell:
	@docker-compose -f docker-compose.dev.yml exec db psql -U crm_user -d crm_db

db-reset:
	@echo "⚠️  WARNING: This will destroy all data!"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose -f docker-compose.dev.yml down -v; \
		docker-compose -f docker-compose.dev.yml up -d db redis elasticsearch; \
		sleep 5; \
		docker-compose -f docker-compose.dev.yml run --rm migrate; \
		echo "✅ Database reset complete!"; \
	else \
		echo "Cancelled."; \
	fi

# =============================================================================
# Testing Commands
# =============================================================================

test:
	@echo "Running all tests..."
	@docker-compose -f docker-compose.dev.yml run --rm gateway pytest tests/ -v

test-unit:
	@echo "Running unit tests..."
	@docker-compose -f docker-compose.dev.yml run --rm gateway pytest tests/unit/ -v

test-int:
	@echo "Running integration tests..."
	@docker-compose -f docker-compose.dev.yml run --rm gateway pytest tests/integration/ -v

test-cov:
	@echo "Running tests with coverage..."
	@docker-compose -f docker-compose.dev.yml run --rm gateway pytest tests/ --cov=services --cov=shared --cov-report=html --cov-report=term

# =============================================================================
# Utility Commands
# =============================================================================

shell:
	@docker-compose -f docker-compose.dev.yml exec gateway /bin/bash

redis-cli:
	@docker-compose -f docker-compose.dev.yml exec redis redis-cli

es-health:
	@echo "Checking Elasticsearch health..."
	@curl -s http://localhost:9200/_cluster/health | python -m json.tool

clean:
	@echo "⚠️  WARNING: This will remove all containers, volumes, and images!"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose -f docker-compose.dev.yml down -v --rmi all; \
		echo "✅ Cleanup complete!"; \
	else \
		echo "Cancelled."; \
	fi

# =============================================================================
# Production Commands
# =============================================================================

build:
	@echo "Building Docker images..."
	@docker-compose -f docker-compose.dev.yml build

prod:
	@echo "Starting CRM system in production mode..."
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services started!"

# =============================================================================
# Quick Start
# =============================================================================

init: dev migrate seed
	@echo ""
	@echo "🎉 CRM System initialized successfully!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open http://localhost:3000 in your browser"
	@echo "  2. Login with sample credentials (see scripts/seed_data.py)"
	@echo "  3. Run 'make logs-f' to monitor logs"
