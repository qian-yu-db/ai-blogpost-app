"""Integration tests for session API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.services.session_manager import session_manager


@pytest.fixture
def async_client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
class TestSessionRoutes:
    async def test_start_session(self, async_client: AsyncClient):
        resp = await async_client.post("/api/session/start", json={"topic_hint": "Delta"})
        assert resp.status_code == 200
        data = resp.json()
        assert "session_id" in data
        assert data["workflow_phase"] == "planning"

    async def test_start_session_empty_hint(self, async_client: AsyncClient):
        resp = await async_client.post("/api/session/start", json={})
        assert resp.status_code == 200

    async def test_get_session(self, async_client: AsyncClient):
        # Create session first
        create_resp = await async_client.post("/api/session/start", json={"topic_hint": "Test"})
        sid = create_resp.json()["session_id"]

        resp = await async_client.get(f"/api/session/{sid}")
        assert resp.status_code == 200
        assert resp.json()["session_id"] == sid

    async def test_get_session_not_found(self, async_client: AsyncClient):
        resp = await async_client.get("/api/session/nonexistent")
        assert resp.status_code == 404

    async def test_transition_phase(self, async_client: AsyncClient):
        create_resp = await async_client.post("/api/session/start", json={})
        sid = create_resp.json()["session_id"]

        resp = await async_client.post(
            f"/api/session/{sid}/transition",
            json={"target_phase": "drafting"},
        )
        assert resp.status_code == 200
        assert resp.json()["workflow_phase"] == "drafting"

    async def test_transition_phase_not_found(self, async_client: AsyncClient):
        resp = await async_client.post(
            "/api/session/nonexistent/transition",
            json={"target_phase": "drafting"},
        )
        assert resp.status_code == 404

    async def test_delete_session(self, async_client: AsyncClient):
        create_resp = await async_client.post("/api/session/start", json={})
        sid = create_resp.json()["session_id"]

        resp = await async_client.delete(f"/api/session/{sid}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"

        # Verify it's gone
        resp = await async_client.get(f"/api/session/{sid}")
        assert resp.status_code == 404

    async def test_delete_session_not_found(self, async_client: AsyncClient):
        resp = await async_client.delete("/api/session/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestSessionResponseShape:
    async def test_full_response_fields(self, async_client: AsyncClient):
        resp = await async_client.post("/api/session/start", json={"topic_hint": "MLflow"})
        data = resp.json()
        assert "session_id" in data
        assert "workflow_phase" in data
        assert "messages" in data
        assert "planning_context" in data
        assert "draft_content" in data
        assert "review_feedback" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_planning_context_fields(self, async_client: AsyncClient):
        resp = await async_client.post("/api/session/start", json={"topic_hint": "Spark"})
        ctx = resp.json()["planning_context"]
        assert ctx["topic"] == "Spark"
        assert ctx["technical_level"] == "intermediate"
        assert ctx["target_length"] == "5"
        assert ctx["style"] == "tutorial"
