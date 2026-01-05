# OAuth Testing Guide

## Where to Test OAuth Flow

The OAuth flow should be tested **in your GitHub Codespace** after deploying the configuration. Here are three ways to test:

---

## Method 1: Automated Test Script (Recommended)

### In Your Codespace Terminal:

```bash
# Make script executable
chmod +x test-oauth.sh

# Run the test
bash test-oauth.sh your-email@gmail.com yourpassword
```

This script will:
1. ✅ Register a test user
2. ✅ Login and get access token
3. ✅ Generate Gmail OAuth URL
4. ✅ Display the URL for you to open in browser

---

## Method 2: Using Swagger UI (Interactive)

### Step-by-Step:

1. **Open API Documentation**:
   ```
   https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/docs
   ```

2. **Register a User**:
   - Find `POST /api/v1/auth/register`
   - Click "Try it out"
   - Fill in:
     ```json
     {
       "email": "your-email@gmail.com",
       "password": "testpassword123",
       "first_name": "Test",
       "last_name": "User"
     }
     ```
   - Click "Execute"

3. **Login**:
   - Find `POST /api/v1/auth/login`
   - Click "Try it out"
   - Fill in:
     - username: `your-email@gmail.com`
     - password: `testpassword123`
   - Click "Execute"
   - **Copy the `access_token`** from the response

4. **Authorize in Swagger**:
   - Click the "Authorize" button at the top
   - Paste your access token
   - Click "Authorize"

5. **Initiate Gmail OAuth**:
   - Find `GET /api/v1/auth/oauth/gmail`
   - Click "Try it out"
   - Click "Execute"
   - **Copy the `auth_url`** from the response

6. **Complete OAuth**:
   - Open the `auth_url` in a new browser tab
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back to the app

---

## Method 3: Through the Frontend (Full User Experience)

### In Your Codespace:

1. **Open Frontend**:
   ```
   https://urban-broccoli-r4q5ggx57wr52474-3000.app.github.dev
   ```

2. **Register/Login**:
   - Create an account or login
   - Navigate to **Settings** page

3. **Connect Gmail**:
   - Look for "Connect Gmail" or "Email Integration" section
   - Click "Connect Gmail Account"
   - Complete OAuth flow in popup/redirect

4. **Verify Connection**:
   - Should see "Gmail Connected" status
   - Email sync should start automatically

---

## Verification Steps

After completing OAuth, verify it worked:

### 1. Check OAuth Token in Database

```bash
# In Codespace terminal
docker-compose -f docker-compose.dev.yml exec db psql -U crm_user -d crm_db -c "SELECT user_id, provider, expires_at FROM oauth_tokens;"
```

Should show your Gmail OAuth token.

### 2. Check Email Sync Status

```bash
curl -X GET 'https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/email/sync/status' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 3. Trigger Email Sync

```bash
curl -X POST 'https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/email/sync/start' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 4. Check Synced Emails

```bash
curl -X GET 'https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/email/list' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Add the Codespace URL to Google Cloud Console:
```
https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/auth/oauth/gmail/callback
```

### Issue: "invalid_client"
**Solution**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env`

### Issue: "Access blocked: This app's request is invalid"
**Solution**: Add your email as a test user in Google Cloud Console → OAuth consent screen

### Issue: OAuth works but no emails sync
**Solution**: 
1. Check Gmail API is enabled in Google Cloud Console
2. Verify scopes include `gmail.readonly`
3. Check email_sync service logs: `docker-compose logs email_sync`

---

## Test User Recommendations

For testing, use:
- **Your personal Gmail account** (easiest for initial testing)
- **A test Gmail account** (recommended for development)
- **G Suite account** (if testing for organization)

> **Note**: During OAuth consent screen setup, if you chose "External" and the app is in "Testing" mode, only test users you explicitly add can authenticate.

---

## Next Steps After Successful OAuth

1. ✅ Verify emails are syncing
2. ✅ Test AI features on synced emails
3. ✅ Test contact extraction from emails
4. ✅ Test lead scoring
5. ✅ Test email classification

---

## Quick Reference

| Action | Command/URL |
|--------|-------------|
| API Docs | `https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/docs` |
| Frontend | `https://urban-broccoli-r4q5ggx57wr52474-3000.app.github.dev` |
| Test Script | `bash test-oauth.sh your-email@gmail.com password` |
| Check Logs | `docker-compose -f docker-compose.dev.yml logs -f auth email_sync` |
| Google Console | `https://console.cloud.google.com/apis/credentials` |

---

## 🎯 Recommended Testing Order

1. **Start with Method 1** (test-oauth.sh) - Fastest way to verify OAuth works
2. **Then try Method 2** (Swagger UI) - Good for debugging API responses
3. **Finally test Method 3** (Frontend) - Full user experience

This ensures each layer works before moving to the next!
