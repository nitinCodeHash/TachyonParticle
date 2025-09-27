import base64

from fastapi import UploadFile, HTTPException
from app.litellm_client import LiteLLMClient
from app.chat_utils import ChatMessageBuilder

# This assumes the LLM provider supports vision (e.g., GPT-4 Vision)
def chat_with_image(image_file: UploadFile, messages: list, provider: str = "openai", llm: LiteLLMClient = None) -> str:
    if image_file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Unsupported image type.")
    image_bytes = image_file.file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    # Use ChatMessageBuilder to append image to last user message
    messages = ChatMessageBuilder.append_image_to_last_user(messages, image_file, image_b64)
    if llm is None:
        from app.litellm_client import LiteLLMClient
        llm = LiteLLMClient(provider=provider)
    response = llm.ask_multimodal(messages)
    return response
