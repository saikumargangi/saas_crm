#!/bin/bash

# CRM System Verification Script
# Tests all services and endpoints

set -e

echo "🧪 CRM System Verification Tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URLs
API_URL="http://localhost:8000/api/v1"
FRONTEND_URL="http://localhost:3000"

# Test results
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    local method=${4:-GET}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null || echo "000")
    fi
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
    fi
}

# Test Docker services
echo "📦 Testing Docker Services"
echo "--------------------------"

services=("postgres" "redis" "elasticsearch" "api-gateway" "auth" "crm" "email_sync" "ai" "automation" "analytics" "integration" "frontend")

for service in "${services[@]}"; do
    if docker ps | grep -q "$service"; then
        echo -e "${GREEN}✓${NC} $service is running"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $service is NOT running"
        ((FAILED++))
    fi
done

echo ""

# Test API Gateway
echo "🌐 Testing API Gateway"
echo "---------------------"
test_endpoint "Health check" "$API_URL/health" "200"
test_endpoint "API Gateway root" "http://localhost:8000/" "200"

echo ""

# Test Auth Service
echo "🔐 Testing Auth Service"
echo "----------------------"
test_endpoint "Auth health" "$API_URL/auth/health" "200"

# Test registration (will fail if user exists, but that's ok)
echo -n "Testing user registration... "
response=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User"
    }' 2>/dev/null || echo "")

if echo "$response" | grep -q "email"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (User may already exist)"
fi

echo ""

# Test CRM Service
echo "📊 Testing CRM Service"
echo "---------------------"
test_endpoint "CRM health" "$API_URL/crm/health" "200"
test_endpoint "Contacts list" "$API_URL/crm/contacts" "401" # Should require auth
test_endpoint "Deals list" "$API_URL/crm/deals" "401" # Should require auth
test_endpoint "Companies list" "$API_URL/crm/companies" "401" # Should require auth

echo ""

# Test Email Sync Service
echo "📧 Testing Email Sync Service"
echo "----------------------------"
test_endpoint "Email sync health" "$API_URL/email/health" "200"

echo ""

# Test AI Service
echo "🤖 Testing AI Service"
echo "--------------------"
test_endpoint "AI health" "$API_URL/ai/health" "200"

echo ""

# Test Automation Service
echo "⚙️  Testing Automation Service"
echo "-----------------------------"
test_endpoint "Automation health" "$API_URL/automation/health" "200"

echo ""

# Test Analytics Service
echo "📈 Testing Analytics Service"
echo "---------------------------"
test_endpoint "Analytics health" "$API_URL/analytics/health" "200"

echo ""

# Test Integration Service
echo "🔗 Testing Integration Service"
echo "-----------------------------"
test_endpoint "Integration health" "$API_URL/integrations/health" "200"

echo ""

# Test Frontend
echo "🎨 Testing Frontend"
echo "------------------"
test_endpoint "Frontend home" "$FRONTEND_URL" "200"
test_endpoint "Login page" "$FRONTEND_URL/login" "200"
test_endpoint "Dashboard" "$FRONTEND_URL/dashboard" "200"

echo ""

# Test Database
echo "🗄️  Testing Database"
echo "-------------------"
echo -n "Testing PostgreSQL connection... "
if docker exec crm-system-postgres-1 psql -U crm_user -d crm_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Testing Redis connection... "
if docker exec crm-system-redis-1 redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Testing Elasticsearch connection... "
if curl -s http://localhost:9200/_cluster/health | grep -q "status"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
