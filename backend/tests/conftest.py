"""Shared fixtures for backend tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.services.session_manager import SessionManager, session_manager


@pytest.fixture
def fresh_session_manager():
    """Return a clean SessionManager for isolation between tests."""
    return SessionManager()


@pytest.fixture(autouse=True)
def _clear_global_sessions():
    """Clear the global session_manager before each test."""
    session_manager._sessions.clear()
    yield
    session_manager._sessions.clear()


@pytest.fixture
def async_client():
    """FastAPI async test client."""
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")
