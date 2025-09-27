
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

    def ask(self, question: str = None, context: str = "", system_prompt: str = None, messages: list = None) -> str:
        if messages is not None:
            payload = messages
        else:
            payload = []
            if system_prompt:
                payload.append({"role": "system", "content": system_prompt})
            if context:
                payload.append({"role": "user", "content": f"Context: {context}"})
            if question is not None:
                payload.append({"role": "user", "content": question})
        response = litellm.completion(
            model=self.model,
            messages=payload,
            api_key=self.api_key,
            max_tokens=512,
            temperature=0.2
        )
        return response['choices'][0]['message']['content'].strip()

    def ask_multimodal(self, messages) -> str:
        # For multimodal models like GPT-4 Vision, Gemini Vision, etc.
        response = litellm.completion(
            model=self.model,
            messages=messages,
            api_key=self.api_key,
            max_tokens=512,
            temperature=0.2
        )
        return response['choices'][0]['message']['content'].strip()

litellm_client = LiteLLMClient()
