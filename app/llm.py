import os
from langchain_openai import ChatOpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class LLMClient:
    def __init__(self, api_key: str = None, model: str = "gpt-3.5-turbo"):
        self.api_key = api_key or OPENAI_API_KEY
        self.model = model
        self.llm = ChatOpenAI(api_key=self.api_key, model_name=self.model, temperature=0.2, max_tokens=512)

    def ask(self, question: str, context: str = "", system_prompt: str = None) -> str:
        prompt = ""
        if system_prompt:
            prompt += f"System: {system_prompt}\n"
        if context:
            prompt += f"Context: {context}\n"
        prompt += f"Question: {question}"
        response = self.llm.invoke(prompt)
        return response.content.strip()

llm_client = LLMClient()
