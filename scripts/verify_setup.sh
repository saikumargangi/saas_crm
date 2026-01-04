#!/bin/bash
# Verification script to test Docker setup and services

set -e

echo "🔍 CRM System - Docker Setup Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed: $(docker --version)"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    exit 1
fi

# Check Docker Compose
echo "2. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed: $(docker-compose --version)"
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    exit 1
fi

# Validate docker-compose.dev.yml
echo "3. Validating docker-compose.dev.yml..."
if docker-compose -f docker-compose.dev.yml config --quiet; then
    echo -e "${GREEN}✓${NC} docker-compose.dev.yml is valid"
else
    echo -e "${RED}✗${NC} docker-compose.dev.yml has errors"
    exit 1
fi

# Check .env file
echo "4. Checking environment variables..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    echo -e "${YELLOW}⚠${NC} .env file not found, copying from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file"
fi

# Check required directories
echo "5. Checking project structure..."
REQUIRED_DIRS=("services" "shared" "migrations" "web" "docker" "scripts")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir/ exists"
    else
        echo -e "${RED}✗${NC} $dir/ is missing"
        exit 1
    fi
done

# Check key files
echo "6. Checking key files..."
KEY_FILES=(
    "Makefile"
    "docker-compose.dev.yml"
    "requirements.txt"
    "alembic.ini"
    "migrations/versions/001_complete_schema.py"
    "shared/database.py"
    "shared/search.py"
    "scripts/seed_data.py"
    "web/styles/design-tokens.css"
)
for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file is missing"
        exit 1
    fi
done

# Check if services are defined in docker-compose
echo "7. Checking service definitions..."
SERVICES=("db" "redis" "elasticsearch" "mailhog" "gateway" "auth" "email_sync" "crm" "ai" "automation" "analytics" "integration" "frontend")
for service in "${SERVICES[@]}"; do
    if docker-compose -f docker-compose.dev.yml config --services | grep -q "^${service}$"; then
        echo -e "${GREEN}✓${NC} Service '$service' is defined"
    else
        echo -e "${RED}✗${NC} Service '$service' is missing"
        exit 1
    fi
done

# Check if ports are available
echo "8. Checking if required ports are available..."
PORTS=(5432 6379 9200 8000 8001 8002 8003 8004 8005 8006 8007 3000 8025)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} Port $port is already in use"
    else
        echo -e "${GREEN}✓${NC} Port $port is available"
    fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'make init' to start all services"
echo "  2. Wait for services to become healthy (~2 minutes)"
echo "  3. Open http://localhost:3000 in your browser"
echo "  4. Login with: admin@crm.local / admin123"
echo ""
echo "Useful commands:"
echo "  make logs-f    - Follow logs"
echo "  make ps        - Show running containers"
echo "  make test      - Run tests"
echo ""
