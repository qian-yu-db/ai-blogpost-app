"""Tests for SessionManager lifecycle."""

from src.services.session_manager import (
    SessionManager,
    WorkflowPhase,
    PlanningContext,
)


class TestSessionLifecycle:
    def test_create_session_returns_session(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        assert session.session_id
        assert session.workflow_phase == WorkflowPhase.PLANNING

    def test_create_session_with_topic_hint(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session(topic_hint="Spark Streaming")
        assert session.planning_context.topic == "Spark Streaming"

    def test_get_session(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        retrieved = fresh_session_manager.get_session(session.session_id)
        assert retrieved is session

    def test_get_session_not_found(self, fresh_session_manager: SessionManager):
        assert fresh_session_manager.get_session("nonexistent") is None

    def test_update_phase(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        updated = fresh_session_manager.update_phase(session.session_id, WorkflowPhase.DRAFTING)
        assert updated.workflow_phase == WorkflowPhase.DRAFTING

    def test_update_phase_nonexistent(self, fresh_session_manager: SessionManager):
        assert fresh_session_manager.update_phase("nope", WorkflowPhase.DRAFTING) is None

    def test_update_session_all_fields(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        ctx = PlanningContext(topic="MLflow", abstract="Using MLflow")
        updated = fresh_session_manager.update_session(
            session.session_id,
            phase=WorkflowPhase.REVIEWING,
            planning_context=ctx,
            draft_content="# Draft",
            review_feedback="Looks good",
        )
        assert updated.workflow_phase == WorkflowPhase.REVIEWING
        assert updated.planning_context.topic == "MLflow"
        assert updated.draft_content == "# Draft"
        assert updated.review_feedback == "Looks good"

    def test_update_session_nonexistent(self, fresh_session_manager: SessionManager):
        assert fresh_session_manager.update_session("nope") is None

    def test_delete_session(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        assert fresh_session_manager.delete_session(session.session_id) is True
        assert fresh_session_manager.get_session(session.session_id) is None

    def test_delete_session_nonexistent(self, fresh_session_manager: SessionManager):
        assert fresh_session_manager.delete_session("nope") is False


class TestConversationHistory:
    def test_add_message(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        msg = fresh_session_manager.add_message(session.session_id, "user", "Hello")
        assert msg.role == "user"
        assert msg.content == "Hello"
        assert msg.id
        assert len(session.messages) == 1

    def test_add_message_with_metadata(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        msg = fresh_session_manager.add_message(
            session.session_id, "assistant", "Hi!", metadata={"tools_used": ["fetch_url"]}
        )
        assert msg.metadata == {"tools_used": ["fetch_url"]}

    def test_add_message_nonexistent_session(self, fresh_session_manager: SessionManager):
        assert fresh_session_manager.add_message("nope", "user", "Hello") is None

    def test_get_conversation_history(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        fresh_session_manager.add_message(session.session_id, "user", "Q1")
        fresh_session_manager.add_message(session.session_id, "assistant", "A1")
        history = fresh_session_manager.get_conversation_history(session.session_id)
        assert len(history) == 2
        assert history[0] == {"role": "user", "content": "Q1"}
        assert history[1] == {"role": "assistant", "content": "A1"}

    def test_get_conversation_history_nonexistent(self, fresh_session_manager: SessionManager):
        assert fresh_session_manager.get_conversation_history("nope") == []

    def test_session_mode_property(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        assert session.mode == "interactive"

    def test_session_phase_property(self, fresh_session_manager: SessionManager):
        session = fresh_session_manager.create_session()
        assert session.phase == WorkflowPhase.PLANNING
