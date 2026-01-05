from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from datetime import timedelta
import httpx
import json

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.database import get_db
from services.auth import models, schemas, utils, dependencies

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(models.User).where(models.User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = utils.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not utils.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = utils.create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = utils.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = utils.decode_access_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
             status_code=status.HTTP_401_UNAUTHORIZED,
             detail="Invalid refresh token",
             headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    # Verify user exists
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=401, detail="User not found")

    new_access_token = utils.create_access_token(data={"sub": str(user.id), "email": user.email})
    # Optionally rotate refresh token here
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token, # Returning same for now, or rotate
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(current_user: models.User = Depends(dependencies.get_current_user)):
    # Stateless logout - client discards token. 
    # To implement true logout with revocation, we'd add token to a blacklist in Redis.
    return {"message": "Successfully logged out"}

@router.get("/user/profile", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

@router.put("/user/profile", response_model=schemas.UserResponse)
async def update_user_profile(
    user_update: schemas.UserUpdate, 
    current_user: models.User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    # Email update might require re-verification, skipping for now complexity
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

# OAuth Stubs (Gmail)
import base64

# ... (imports)

@router.get("/oauth/gmail")
async def oauth_gmail_init(current_user: models.User = Depends(dependencies.get_current_user)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/oauth/gmail/callback")
    scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email"
    
    if not client_id:
        raise HTTPException(status_code=500, detail="Server misconfiguration: Missing GOOGLE_CLIENT_ID")

    # Encode user_id in state to link account on callback
    state_data = json.dumps({"user_id": str(current_user.id)})
    state = base64.urlsafe_b64encode(state_data.encode()).decode()

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={state}"
    )
    return {"auth_url": auth_url}

@router.get("/oauth/gmail/callback")
async def oauth_gmail_callback(code: str, state: str = None, db: AsyncSession = Depends(get_db)):
    # 1. Exchange code for access token
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/oauth/gmail/callback")

    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Server misconfiguration: Missing Google Credentials")

    token_url = "https://oauth2.googleapis.com/token"
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        })
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve token: {response.text}")

    token_data = response.json()

    # 2. Identify User from State
    user = None
    if state:
        try:
            state_json = base64.urlsafe_b64decode(state).decode()
            state_data = json.loads(state_json)
            user_id = state_data.get("user_id")
            if user_id:
                result = await db.execute(select(models.User).where(models.User.id == user_id))
                user = result.scalars().first()
        except Exception as e:
            print(f"State decoding error: {e}")
            pass
    
    # Fallback: Try to find user by email (if state failed or matched email)
    if not user:
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        async with httpx.AsyncClient() as client:
            user_res = await client.get(user_info_url, headers={"Authorization": f"Bearer {token_data['access_token']}"})
        
        if user_res.status_code == 200:
            google_user = user_res.json()
            email = google_user.get('email')
            result = await db.execute(select(models.User).where(models.User.email == email))
            user = result.scalars().first()

    if not user:
         raise HTTPException(status_code=404, detail="User not found. Ensure you initiate connection from the Settings page.")

    # 4. Encrypt tokens
    from services.auth.utils import encrypt_token
    
    encrypted_access = encrypt_token(token_data['access_token'])
    encrypted_refresh = encrypt_token(token_data.get('refresh_token', ''))

    # 5. Store/Update in oauth_tokens table
    # Check if token exists
    token_query = await db.execute(
        select(models.OAuthToken)
        .where(models.OAuthToken.user_id == user.id)
        .where(models.OAuthToken.provider == 'gmail')
    )
    existing_token = token_query.scalars().first()

    if existing_token:
        existing_token.access_token = encrypted_access
        if token_data.get('refresh_token'):
            existing_token.refresh_token = encrypted_refresh
        existing_token.expires_at = func.now() + timedelta(seconds=token_data.get('expires_in', 3600))
    else:
        new_token = models.OAuthToken(
            user_id=user.id,
            provider='gmail',
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            expires_at=func.now() + timedelta(seconds=token_data.get('expires_in', 3600)),
            scopes=token_data.get('scope', '').split(' ')
        )
        db.add(new_token)
    
    await db.commit()

    # Trigger initial sync in background
    # We make an internal API call or invoke the service directly.
    # Invoking directly is better if possible, but cross-service dependencies are circular.
    # Simple valid approach: Fire and forget HTTP request to own API or use BackgroundTasks if we can restructure.
    # Here, we will use httpx to call our own sync endpoint to decouple.
    try:
        # Assuming Gateway is running on localhost:8000
        sync_url = "http://localhost:8000/api/v1/email/sync/start"
        # We need to pass the user's token, but we just saved it.
        # The sync endpoint expects a user dependency.
        # Bypass: We will implement a direct service call if we can import it, 
        # but to avoid circular imports, let's use the API with a service token or similar.
        # EASIEST MVP FIX: Just call the logic here if possible, but imports are messy.
        
        # ACTUALLY: Let's just instruct the frontend to trigger the sync.
        # That is safer. We will add a query param to the redirect.
        pass
    except Exception as e:
        print(f"Failed to trigger sync: {e}")

    # Redirect logic
    from fastapi.responses import RedirectResponse
    # Append sync_trigger=true to let frontend know it should start polling or show "Syncing..."
    return RedirectResponse(url="http://localhost:3000/settings?gmail_connected=true&trigger_sync=true")
