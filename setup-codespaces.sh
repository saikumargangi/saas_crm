#!/bin/bash
# Auto-setup script for Codespaces - copies .env.development to .env

echo "🚀 Setting up CRM environment..."

# Copy development env file
if [ ! -f .env ]; then
    cp .env.development .env
    echo "✅ Created .env from .env.development"
else
    echo "ℹ️  .env already exists"
fi

echo "✅ Environment ready!"
echo ""
echo "Next steps:"
echo "1. Run: make dev"
echo "2. Wait 5-10 minutes for services to start"
echo "3. Access frontend on port 3000"
echo "4. Access API on port 8000"
