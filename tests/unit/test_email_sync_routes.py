import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from services.email_sync.routes import router
from services.email_sync import models
from services.auth import dependencies
from shared.database import get_db

app = FastAPI()
app.include_router(router)

client = TestClient(app)

# Mocks
mock_user = MagicMock()
mock_user.id = "user_id_123" # UUID string
mock_user.email = "test@example.com"
mock_user.is_active = True

mock_db = AsyncMock()

@pytest.fixture
def override_deps():
    app.dependency_overrides[dependencies.get_current_active_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db
    yield
    app.dependency_overrides = {}

def test_sync_status_active_fix_verification(override_deps):
    """
    Test /sync/status endpoint.
    Crucially, verify that accessing 'is_syncing' (which doesn't exist) is NOT done.
    And verify 'sync_status' is used.
    """
    # 1. Mock OAuthToken query result (Token found)
    mock_token_result = MagicMock()
    mock_token = MagicMock() # Represents OAuthToken
    mock_token_result.scalars.return_value.first.return_value = mock_token

    # 2. Mock SyncState query result
    mock_sync_result = MagicMock()
    
    # Create SyncState mock that STRICTLY resembles the actual model (no is_syncing)
    # We use spec=models.SyncState so accessing 'is_syncing' raises AttributeError
    mock_sync_state = MagicMock(spec=models.SyncState)
    mock_sync_state.sync_status = "active"
    mock_sync_state.last_sync_at = None
    mock_sync_state.last_history_id = "123"
    
    mock_sync_result.scalars.return_value.first.return_value = mock_sync_state

    # db.execute determines which result to return.
    # The route calls:
    # 1. db.execute(select(OAuthToken)...)
    # 2. db.execute(select(SyncState)...)
    mock_db.execute.side_effect = [mock_token_result, mock_sync_result]

    # Act
    response = client.get("/api/v1/email/sync/status")

    # Assert
    # If the code accessed .is_syncing, MagicMock spec would raise AttributeError, causing 500
    if response.status_code == 500:
        print(f"FAILED: 500 Error: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["sync_status"] == "active"
    assert data["total_emails"] == 0 # Verified fix

def test_stop_sync_fix_verification(override_deps):
    """
    Test /sync/stop endpoint.
    Verify it sets sync_status="inactive" instead of is_syncing=False.
    """
    # Mock SyncState found
    mock_sync_result = MagicMock()
    mock_sync_state = MagicMock(spec=models.SyncState)
    mock_sync_state.sync_status = "active"
    
    mock_sync_result.scalars.return_value.first.return_value = mock_sync_state
    
    mock_db.execute.side_effect = [mock_sync_result]
    
    # Act
    response = client.post("/api/v1/email/sync/stop")
    
    # Assert
    assert response.status_code == 200
    assert response.json()["status"] == "stopped"
    
    # Verify the SET operation
    # Since we used spec, if code tried "mock_sync_state.is_syncing = False", it fails?
    # Actually, setting attributes on a mock with spec IS allowed usually, unless spec_set=True.
    # But checking the value is what matters.
    assert mock_sync_state.sync_status == "inactive"
