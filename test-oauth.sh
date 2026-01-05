#!/bin/bash
# =============================================================================
# OAuth Flow Test Script
# =============================================================================
# Run this in your Codespace to test the complete OAuth flow
#
# Usage: bash test-oauth.sh <your-email@gmail.com> <password>

set -e

BASE_URL="https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev"
EMAIL="${1}"
PASSWORD="${2}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "❌ Error: Email and password required"
    echo "Usage: bash test-oauth.sh <your-email@gmail.com> <password>"
    exit 1
fi

echo "🧪 Testing OAuth Flow for CRM System"
echo "===================================="
echo ""

# Step 1: Register User
echo "📝 Step 1: Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "error\|detail"; then
    echo "⚠️  User might already exist (this is OK)"
    echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
else
    echo "✅ User registered successfully"
fi
echo ""

# Step 2: Login
echo "🔐 Step 2: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${EMAIL}&password=${PASSWORD}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Login failed"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 3: Get OAuth URL
echo "🔗 Step 3: Getting Gmail OAuth URL..."
OAUTH_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/auth/oauth/gmail" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

AUTH_URL=$(echo "$OAUTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['auth_url'])" 2>/dev/null)

if [ -z "$AUTH_URL" ]; then
    echo "❌ Failed to get OAuth URL"
    echo "$OAUTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$OAUTH_RESPONSE"
    exit 1
fi

echo "✅ OAuth URL generated successfully"
echo ""
echo "===================================="
echo "🎉 OAuth Flow Test Complete!"
echo "===================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open this URL in your browser:"
echo "   ${AUTH_URL}"
echo ""
echo "2. Sign in with your Google account"
echo "3. Grant permissions to the CRM app"
echo "4. You'll be redirected back to the app"
echo ""
echo "💡 Tip: Copy the URL above and paste it in your browser"
echo ""
echo "🔍 To verify the connection worked:"
echo "   curl -X GET '${BASE_URL}/api/v1/email/sync/status' \\"
echo "     -H 'Authorization: Bearer ${ACCESS_TOKEN}'"
echo ""
