# CRM System API Endpoints

## Base URL
- **Local/Codespace**: `http://localhost:8000`
- **All endpoints are prefixed with**: `/api/v1/`

## Quick Access

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Available Services

### 1. Authentication Service
**Base**: `/api/v1/auth`

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (returns JWT token)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/user/profile` - Get current user profile
- `PUT /api/v1/auth/user/profile` - Update user profile
- `GET /api/v1/auth/oauth/gmail` - Initiate Gmail OAuth
- `GET /api/v1/auth/oauth/gmail/callback` - Gmail OAuth callback

### 2. CRM Service
**Base**: `/api/v1/crm`

- Companies, Contacts, Deals, Activities endpoints

### 3. Email Service
**Base**: `/api/v1/email`

- Email sync and management endpoints

### 4. AI Service
**Base**: `/api/v1/ai`

- AI-powered features and insights

### 5. Automation Service
**Base**: `/api/v1/automation`

- Workflow automation endpoints

### 6. Analytics Service
**Base**: `/api/v1/analytics`

- Analytics and reporting endpoints

### 7. Integration Service
**Base**: `/api/v1/integrations`

- Third-party integrations

## Example Usage

### Check if API is running
```bash
curl http://localhost:8000/health
```

### View API Documentation
Open in browser: http://localhost:8000/docs

### Register a new user
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=yourpassword"
```

## Frontend Access
The Next.js frontend runs on port 3000 and connects to the API gateway on port 8000.

**Frontend URL**: http://localhost:3000
