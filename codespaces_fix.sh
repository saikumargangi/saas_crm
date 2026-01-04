#!/bin/bash
# Codespaces Quick Fix Script - Run this in Codespaces to fix all errors

echo "🔧 Fixing CRM System Issues..."

# 1. Fix Next.js config for Turbopack
echo "1️⃣ Fixing Next.js Turbopack configuration..."
cat > web/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
    
    experimental: {
        optimizeCss: true,
    },
    
    // Empty turbopack config to silence error
    turbopack: {},
};

module.exports = nextConfig;
EOF

# 2. Add missing dependencies to requirements.txt
echo "2️⃣ Adding missing Python dependencies..."
cat >> requirements.txt << 'EOF'
beautifulsoup4>=4.12.0
cryptography>=42.0.0
EOF

# 3. Create missing shared/auth.py module
echo "3️⃣ Creating shared/auth.py module..."
cat > shared/auth.py << 'EOF'
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
import os

security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    """Validate JWT token and return user data"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
EOF

# 4. Create .env file with required variables
echo "4️⃣ Creating .env file..."
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://crm_user:password@db:5432/crm_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-min-32-chars

# Encryption (32 url-safe base64-encoded bytes)
ENCRYPTION_KEY=your-encryption-key-base64-encoded-32-bytes-change-this

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Gmail API
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly

# AI (optional)
AI_PROVIDER=openai
OPENAI_API_KEY=
GEMINI_API_KEY=
EOF

# 5. Generate proper encryption key
echo "5️⃣ Generating encryption key..."
python3 << 'PYTHON'
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(f"\nGenerated ENCRYPTION_KEY: {key.decode()}")
print("\nAdd this to your .env file:")
print(f"ENCRYPTION_KEY={key.decode()}")
PYTHON

# 6. Stop and clean Docker
echo "6️⃣ Cleaning Docker containers..."
docker-compose -f docker-compose.dev.yml down -v

echo "✅ Fixes applied!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the ENCRYPTION_KEY from above and add it to .env file"
echo "2. Run: make dev"
echo "3. Wait for services to start (~5-10 minutes)"
echo "4. Access frontend at port 3000"
EOF
chmod +x codespaces_fix.sh
