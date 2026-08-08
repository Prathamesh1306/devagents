import uuid
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from shared.db.base import Base
from shared.db.models import Task, LLMCall
from shared.llm.base import LLMResponse
from shared.llm.providers import StubLLMClient

class TestLLMCallsLedger(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

        # Create parent task
        self.task_id = uuid.uuid4()
        self.task = Task(
            id=self.task_id,
            task_prompt="Test ledger prompt",
            final_status="running",
            token_budget=50000,
            tokens_used=0
        )
        self.db.add(self.task)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_llm_call_creation(self):
        call = LLMCall(
            task_id=self.task_id,
            node_name="planner",
            model="stub-gpt-4o",
            prompt_tokens=15,
            completion_tokens=10,
            cost_usd=0.000150,
            latency_ms=120
        )
        self.db.add(call)
        self.db.commit()

        fetched = self.db.query(LLMCall).filter_by(task_id=self.task_id).first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.node_name, "planner")
        self.assertEqual(fetched.model, "stub-gpt-4o")
        self.assertEqual(fetched.prompt_tokens, 15)
        self.assertEqual(fetched.completion_tokens, 10)

    def test_log_llm_call_helper(self):
        client = StubLLMClient()
        response = LLMResponse(
            content="Plan",
            model="stub-gpt-4o",
            provider="stub",
            prompt_tokens=20,
            completion_tokens=10,
            cost_usd=0.0
        )

        record = client.log_llm_call(
            db_session=self.db,
            task_id=self.task_id,
            node_name="coder",
            response=response,
            latency_ms=85
        )

        self.assertIsNotNone(record.id)
        self.assertEqual(record.node_name, "coder")
        self.assertEqual(record.latency_ms, 85)

if __name__ == "__main__":
    unittest.main()
