# Important Configuration Files

## google_console.json
This file contains your Google OAuth credentials. **DO NOT commit to git.**

## setup-env.sh
Run this script to automatically configure your `.env` file from `google_console.json`:
```bash
bash setup-env.sh
```

## OAuth Redirect URI Configuration

### For Codespace
Your OAuth redirect URI is configured as:
```
https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/auth/oauth/gmail/callback
```

### Important: Update Google Cloud Console
You must add this redirect URI to your Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/api/v1/auth/oauth/gmail/callback
   ```
4. Click **Save**

### For Local Development
If running locally, the redirect URI is:
```
http://localhost:8000/api/v1/auth/oauth/gmail/callback
```

## Environment Variables Configured

✅ **Database**: PostgreSQL connection configured  
✅ **Redis**: Cache and pub/sub configured  
✅ **Elasticsearch**: Search indexing configured  
✅ **JWT**: Secure token generation configured  
✅ **Google OAuth**: Client ID and Secret configured  
✅ **Gmail API**: Scopes for read, send, modify configured  
✅ **Encryption**: AES-256 key for token storage configured  
✅ **Gemini AI**: API key configured  
✅ **CORS**: Codespace URLs whitelisted  
✅ **Frontend**: API URLs configured for Codespace

## Next Steps

1. **Update Google Cloud Console** with the Codespace redirect URI (see above)
2. **Deploy to Codespace**:
   ```bash
   git add setup-env.sh .gitignore
   git commit -m "Add environment configuration script"
   git push origin main
   ```
3. **In Codespace, run**:
   ```bash
   git pull origin main
   bash setup-env.sh
   docker-compose -f docker-compose.dev.yml restart auth email_sync ai
   ```
4. **Test OAuth flow**:
   - Visit: https://urban-broccoli-r4q5ggx57wr52474-8000.app.github.dev/docs
   - Try the `/api/v1/auth/oauth/gmail` endpoint

## Security Notes

- `.env` file is gitignored (never committed)
- `google_console.json` should be added to `.gitignore`
- All OAuth tokens are encrypted in database
- Use HTTPS in production
