from app.chat_utils import ChatMessageBuilder
from app.image_chat import chat_with_image

# Chat session and chat endpoints
from app.db import (
    create_chat_session,
    save_user_message,
    save_assistant_message,
    get_last_n_messages,
    get_session_or_create,
    get_all_sessions,
    get_session_files,
    get_session_model
)
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import hashlib
import os
from app.utils import (
    validate_file,
    save_file,
    extract_text_from_file,
    get_file_md5,
    is_file_unique,
    extract_metadata_from_file
)
from app.vectordb import vectordb
from app.db import add_document_meta, get_document_meta, SessionLocal, DocumentMeta

from app.litellm_client import litellm_client
import logging

app = FastAPI()
UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post(
    "/ingest",
    summary="Ingest a document",
    description="Upload and ingest a document (PDF, DOCX, TXT, or image). If the file is an image, OCR is performed. Supports chunking and deduplication."
)
async def ingest_document(
    file: UploadFile = File(..., description="Document file to upload (PDF, DOCX, TXT, or image)"),
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    session_id: Optional[str] = Form(None, description="Session ID to associate this file with (optional)")
):
    """Ingest a document with optional chunking parameters."""
    validate_file(file)
    file_bytes = await file.read()
    file_md5 = get_file_md5(file_bytes)
    if not is_file_unique(file_md5, UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Duplicate file detected.")
    file_path = save_file(file, file_bytes, UPLOAD_DIR)
    text = extract_text_from_file(file_path)
    # Extract metadata for PDF/DOCX
    metadata = extract_metadata_from_file(file_path)
    # Chunk and embed using vectordb with custom params
    chunks = vectordb.chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    embeddings = vectordb.embed_chunks(chunks)
    doc_name = os.path.splitext(file.filename)[0]
    # Pass metadata for each chunk
    chunk_metadata = [metadata for _ in chunks]
    vectordb.save_index(doc_name, embeddings, chunks, chunk_metadata=chunk_metadata)
    # Store metadata in SQLite (as JSON in extra)
    import json
    if session_id:
        metadata["session_id"] = session_id
    add_document_meta(file.filename, file_md5, file.content_type, "indexed", extra=json.dumps(metadata))
    # Optionally save extracted text
    with open(f"{file_path}.txt", "w", encoding="utf-8") as f:
        f.write(text)
    return {"filename": file.filename, "md5": file_md5, "chunks": len(chunks), "status": "ingested and indexed", "chunk_size": chunk_size, "chunk_overlap": chunk_overlap, "metadata": metadata}


# Create a new chat session
@app.post(
    "/chat/session",
    summary="Create chat session",
    description="Create a new chat session for multi-turn conversations. Select model for this session. Returns a session ID."
)
def create_session(model_name: str = Form(..., description="Model name to use for this session (e.g., gpt-4-vision-preview)")):
    session_id = create_chat_session(model_name)
    return {"session_id": session_id, "model_name": model_name}
# List all chat sessions
@app.get(
    "/chat/sessions",
    summary="List all chat sessions",
    description="Get all chat sessions with their creation time and model."
)
def list_sessions():
    return get_all_sessions()
# List/download/view files for a session
@app.get(
    "/chat/session/{session_id}/files",
    summary="List files for a session",
    description="List all files uploaded or created in a chat session."
)
def list_session_files(session_id: str):
    return {"files": get_session_files(session_id)}

@app.get(
    "/chat/session/{session_id}/file/{filename}",
    summary="Download/view a file from session",
    description="Download or view a file uploaded/created in a session."
)
def get_session_file(session_id: str, filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    from fastapi.responses import FileResponse
    return FileResponse(file_path, filename=filename)

# Chat with LLM using session and history
from fastapi import Body

@app.post(
    "/chat",
    summary="Chat with LLM",
    description="Send a message in a chat session. Maintains history and context for multi-turn conversations."
)
def chat_with_llm(
    session_id: str = Body(..., embed=True, description="Session ID from /chat/session"),
    message: str = Body(..., embed=True, description="User message to send to the LLM")
):
    session_id = get_session_or_create(session_id)
    save_user_message(session_id, message)
    history = get_last_n_messages(session_id)
    messages = ChatMessageBuilder.build_messages(history, user_message=message)
    model_name = get_session_model(session_id)
    llm = litellm_client.__class__(model=model_name) if model_name else litellm_client
    answer = llm.ask(messages=messages)
    save_assistant_message(session_id, answer)
    return {"answer": answer, "session_id": session_id, "history": [{"role": m.role, "message": m.message} for m in history]}

@app.post(
    "/ask",
    summary="Ask question on document",
    description="Ask a question about an uploaded document. Performs semantic search and uses LLM to answer based on document content."
)
async def ask_question(
    document_name: str = Form(..., description="Filename of the uploaded document (with extension)"),
    question: str = Form(..., description="Question to ask about the document"),
    session_id: Optional[str] = Form(None, description="Session ID for chat history (optional)")
):
    session_id = get_session_or_create(session_id)
    save_user_message(session_id, question)
    meta = get_document_meta(document_name)
    logging.info(f"Document metadata: {meta}")
    if not meta:
        return {"answer": "Document not found or not indexed."}
    doc_base = os.path.splitext(document_name)[0]
    results = vectordb.search(doc_base, question, top_k=3)
    if not results:
        return {"answer": "No relevant content found."}
    history = get_last_n_messages(session_id)
    semantic_context = "\n".join(results)
    messages = ChatMessageBuilder.build_messages(history, user_message=question, semantic_context=semantic_context)
    model_name = get_session_model(session_id)
    llm = litellm_client.__class__(model=model_name) if model_name else litellm_client
    answer = llm.ask(messages=messages)
    save_assistant_message(session_id, answer)
    return {"answer": answer, "context": results, "session_id": session_id, "history": [{"role": m.role, "message": m.message} for m in history]}


from fastapi import status

# List all uploaded files and metadata
@app.get(
    "/files",
    summary="List uploaded files",
    description="List all uploaded documents and their metadata."
)
def list_files():
    import json
    db = SessionLocal()
    files = db.query(DocumentMeta).all()
    db.close()
    return [
        {
            "filename": f.filename,
            "md5": f.md5,
            "filetype": f.filetype,
            "status": f.status,
            "metadata": json.loads(f.extra) if f.extra else None
        } for f in files
    ]

# Delete a file and its metadata and vectors
@app.delete(
    "/files/{filename}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file",
    description="Delete an uploaded document, its metadata, and all associated vectors."
)
def delete_file(filename: str):
    db = SessionLocal()
    doc = db.query(DocumentMeta).filter(DocumentMeta.filename == filename).first()
    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="File not found.")
    # Delete file and related files
    file_path = os.path.join(UPLOAD_DIR, filename)
    for ext in ["", ".md5", ".txt"]:
        try:
            os.remove(file_path + ext)
        except FileNotFoundError:
            pass
    # Remove all vectors for this file from Qdrant
    doc_name = os.path.splitext(filename)[0]
    # Qdrant API: delete by filter
    vectordb.client.delete(collection_name=vectordb.collection_name, filter={"must": [{"key": "doc_name", "match": {"value": doc_name}}]})
    # Remove metadata
    db.delete(doc)
    db.commit()
    db.close()
    return


@app.post(
    "/chat/image",
    summary="Chat with an image",
    description="Upload an image and ask a question about it. Uses a multimodal LLM (e.g., GPT-4 Vision) to analyze the image and answer."
)
async def chat_image(
    image: UploadFile = File(..., description="Image file (PNG, JPG, JPEG)"),
    question: str = Form(..., description="Question to ask about the image"),
    provider: str = Form("openai", description="LLM provider (e.g., openai, gemini)"),
    session_id: Optional[str] = Form(None, description="Session ID for chat history (optional)")
):
    try:
        session_id = get_session_or_create(session_id)
        save_user_message(session_id, question)
        history = get_last_n_messages(session_id)
        model_name = get_session_model(session_id)
        from app.litellm_client import LiteLLMClient
        llm = LiteLLMClient(model=model_name) if model_name else litellm_client
        messages = ChatMessageBuilder.build_messages(history, user_message=question)
        answer = chat_with_image(image, messages=messages, provider=provider, llm=llm)
        save_assistant_message(session_id, answer)
        return {"answer": answer, "session_id": session_id, "history": [{"role": m.role, "message": m.message} for m in history]}
    except Exception as e:
        logging.error(f"Image chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
