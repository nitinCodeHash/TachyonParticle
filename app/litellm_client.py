
import os
import litellm

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gpt-3.5-turbo")


class LiteLLMClient:
    def __init__(self, api_key: str = None, model: str = None, provider: str = "openai"):
        self.provider = provider
        if provider == "openai":
            self.api_key = api_key or OPENAI_API_KEY
        elif provider == "gemini":
            self.api_key = api_key or GEMINI_API_KEY
        else:
            self.api_key = api_key
        self.model = model or LITELLM_MODEL

    def ask(self, question: str, context: str = "", system_prompt: str = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            messages.append({"role": "user", "content": f"Context: {context}"})
        messages.append({"role": "user", "content": question})
        response = litellm.completion(
            model=self.model,
            messages=messages,
            api_key=self.api_key,
            max_tokens=512,
            temperature=0.2
        )
        return response['choices'][0]['message']['content'].strip()

litellm_client = LiteLLMClient()
