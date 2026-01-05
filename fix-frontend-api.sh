#!/bin/bash
# =============================================================================
# Fix Frontend API Connection in Codespace
# =============================================================================

set -e

echo "🔧 Fixing Frontend API Configuration for Codespace..."

# Create/Update web/.env.local with Codespace URL
cat > web/.env.local << 'EOF'
# Frontend Environment Variables for Codespace
NEXT_PUBLIC_API_URL=https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1
NEXT_PUBLIC_WS_URL=wss://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev
EOF

echo "✅ Updated web/.env.local with Codespace URLs"
echo ""
echo "📋 Configuration:"
echo "  API URL: https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1"
echo ""
echo "🚀 Next steps:"
echo "  1. Restart the frontend:"
echo "     docker-compose -f docker-compose.dev.yml restart frontend"
echo ""
echo "  2. Wait 10-20 seconds for frontend to rebuild"
echo ""
echo "  3. Refresh your browser:"
echo "     https://urban-broccoli-r4q5ggx57wr52474-3000.app.github.dev"
echo ""
echo "✨ The 'Failed to fetch' error should be fixed!"
