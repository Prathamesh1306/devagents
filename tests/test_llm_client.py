import os
import unittest
from shared.llm import get_llm_client, StubLLMClient, OpenAILLMClient, AnthropicLLMClient, OllamaLLMClient
from shared.graph.workflow import create_agent_graph

class TestLLMClient(unittest.TestCase):

    def test_llm_client_factory_providers(self):
        # 1. Stub Provider
        stub_client = get_llm_client("stub")
        self.assertIsInstance(stub_client, StubLLMClient)
        res_stub = stub_client.generate("Test prompt")
        self.assertEqual(res_stub.provider, "stub")
        self.assertGreater(res_stub.total_tokens, 0)

        # 2. OpenAI Provider
        openai_client = get_llm_client("openai")
        self.assertIsInstance(openai_client, OpenAILLMClient)

        # 3. Anthropic Provider
        anthropic_client = get_llm_client("anthropic")
        self.assertIsInstance(anthropic_client, AnthropicLLMClient)

        # 4. Ollama Provider
        ollama_client = get_llm_client("ollama")
        self.assertIsInstance(ollama_client, OllamaLLMClient)

    def test_llm_client_factory_env_variable(self):
        old_env = os.environ.get("LLM_PROVIDER")
        try:
            os.environ["LLM_PROVIDER"] = "stub"
            client = get_llm_client()
            self.assertIsInstance(client, StubLLMClient)

            os.environ["LLM_PROVIDER"] = "openai"
            client = get_llm_client()
            self.assertIsInstance(client, OpenAILLMClient)

            os.environ["LLM_PROVIDER"] = "anthropic"
            client = get_llm_client()
            self.assertIsInstance(client, AnthropicLLMClient)
        finally:
            if old_env is not None:
                os.environ["LLM_PROVIDER"] = old_env
            else:
                os.environ.pop("LLM_PROVIDER", None)

    def test_invalid_provider(self):
        with self.assertRaises(ValueError):
            get_llm_client("invalid_provider_name")

    def test_graph_runs_with_multiple_providers(self):
        graph = create_agent_graph()

        old_env = os.environ.get("LLM_PROVIDER")
        try:
            # Run graph with Stub provider
            os.environ["LLM_PROVIDER"] = "stub"
            state_stub = graph.invoke({"task_id": "t1", "prompt": "Create endpoint", "status": "pending", "logs": [], "tokens_used": 0})
            self.assertEqual(state_stub["status"], "completed")
            self.assertIn("Planner node executed using provider 'stub'", state_stub["logs"][0])

            # Run same graph with OpenAI provider (swapped via config flag)
            os.environ["LLM_PROVIDER"] = "openai"
            state_openai = graph.invoke({"task_id": "t2", "prompt": "Create endpoint", "status": "pending", "logs": [], "tokens_used": 0})
            self.assertEqual(state_openai["status"], "completed")
            self.assertIn("Planner node executed using provider 'openai'", state_openai["logs"][0])
        finally:
            if old_env is not None:
                os.environ["LLM_PROVIDER"] = old_env
            else:
                os.environ.pop("LLM_PROVIDER", None)

if __name__ == "__main__":
    unittest.main()
