class ChatMessageBuilder:
    @staticmethod
    def append_image_to_last_user(messages, image_file, image_b64):
        image_url = {"url": f"data:{image_file.content_type};base64,{image_b64}"}
        if messages and messages[-1]["role"] == "user":
            # If last user message is plain text, convert to multimodal
            if isinstance(messages[-1]["content"], str):
                messages[-1]["content"] = [
                    {"type": "text", "text": messages[-1]["content"]},
                    {"type": "image_url", "image_url": image_url}
                ]
            elif isinstance(messages[-1]["content"], list):
                messages[-1]["content"].append({"type": "image_url", "image_url": image_url})
        else:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": image_url}
                ]
            })
        return messages
    @staticmethod
    def build_messages(history, user_message=None, system_prompt=None, semantic_context=None, image=None):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if semantic_context:
            messages.append({"role": "system", "content": f"Relevant context:\n{semantic_context}"})
        for m in history:
            messages.append({"role": m.role, "content": m.message})
        if user_message is not None:
            if image is not None:
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_message},
                        {"type": "image_url", "image_url": image}
                    ]
                })
            else:
                messages.append({"role": "user", "content": user_message})
        return messages
