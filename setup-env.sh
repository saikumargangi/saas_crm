#!/bin/bash
# =============================================================================
# CRM System - Auto-Configure Environment from google_console.json
# =============================================================================

set -e

echo "🔧 Configuring CRM System Environment..."

# Check if google_console.json exists
if [ ! -f "google_console.json" ]; then
    echo "❌ Error: google_console.json not found"
    exit 1
fi

# Extract credentials from JSON
CLIENT_ID=$(cat google_console.json | python3 -c "import sys, json; print(json.load(sys.stdin)['web']['client_id'])")
CLIENT_SECRET=$(cat google_console.json | python3 -c "import sys, json; print(json.load(sys.stdin)['web']['client_secret'])")

echo "📋 Extracted credentials from google_console.json"

# Create .env file
cat > .env << EOF
# =============================================================================
# CRM System Environment Variables - AUTO-CONFIGURED
# Generated: $(date)
# =============================================================================

# Database Configuration
DATABASE_URL=postgresql+asyncpg://crm_user:password@db:5432/crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=password
POSTGRES_DB=crm_db

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://elasticsearch:9200

# JWT Configuration
JWT_SECRET_KEY=crm-production-secret-key-2026-change-this-in-real-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# OAuth 2.0 - Google/Gmail
GOOGLE_CLIENT_ID=${CLIENT_ID}
GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}
GOOGLE_REDIRECT_URI=https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/auth/oauth/gmail/callback

# Gmail API Scopes
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.modify

# Encryption Key (for OAuth token storage)
ENCRYPTION_KEY=KMYSYbArdxhE7ln3ReQLtLYSX0DVmjkrsqGwGdgYJLQ=

# AI Service Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyA4UBH18aZehgXkgYpr8sgWbCIDIDPkp-w
GEMINI_MODEL=gemini-pro

# Email Configuration (Development - Mailhog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_FROM_EMAIL=noreply@crm.local

# Storage
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=/app/storage

# Pub/Sub
PUBSUB_BACKEND=redis

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# CORS - Codespace URLs
CORS_ORIGINS=https://urban-broccoli-r4q5ggx57wr52474-3000.app.github.dev,https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev,http://localhost:3000,http://localhost:8000

# Frontend
NEXT_PUBLIC_API_URL=https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev
NEXT_PUBLIC_WS_URL=wss://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev

# Logging
LOG_LEVEL=INFO
ENVIRONMENT=development
DEBUG=true
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "  ✓ Google Client ID: ${CLIENT_ID}"
echo "  ✓ Google Client Secret: ${CLIENT_SECRET:0:15}..."
echo "  ✓ Gemini API Key: AIzaSyA4UBH18aZehgXkgYpr8sgWbCIDIDPkp-w"
echo "  ✓ Encryption Key: Generated and configured"
echo "  ✓ Codespace URLs: Configured"
echo ""
echo "🚀 Next steps:"
echo "  1. Restart services:"
echo "     docker-compose -f docker-compose.dev.yml restart auth email_sync ai"
echo ""
echo "  2. Check service logs:"
echo "     docker-compose -f docker-compose.dev.yml logs -f auth"
echo ""
echo "  3. Test the API:"
echo "     Visit: https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/docs"
echo ""
echo "✨ Configuration complete! Your CRM system is ready to use."
