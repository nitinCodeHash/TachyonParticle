# Chat session and chat endpoints
from app.db import create_chat_session, add_chat_message, get_last_messages
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
    is_file_unique
)
from app.vectordb import vectordb
from app.db import add_document_meta, get_document_meta, SessionLocal, DocumentMeta

from app.litellm_client import litellm_client

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
    chunk_overlap: int = 50
):
    """Ingest a document with optional chunking parameters."""
    validate_file(file)
    file_bytes = await file.read()
    file_md5 = get_file_md5(file_bytes)
    if not is_file_unique(file_md5, UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Duplicate file detected.")
    file_path = save_file(file, file_bytes, UPLOAD_DIR)
    text = extract_text_from_file(file_path)
    # Chunk and embed using vectordb with custom params
    chunks = vectordb.chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    embeddings = vectordb.embed_chunks(chunks)
    doc_name = os.path.splitext(file.filename)[0]
    vectordb.save_index(doc_name, embeddings, chunks)
    # Store metadata in SQLite
    add_document_meta(file.filename, file_md5, file.content_type, "indexed", extra=None)
    # Optionally save extracted text
    with open(f"{file_path}.txt", "w", encoding="utf-8") as f:
        f.write(text)
    return {"filename": file.filename, "md5": file_md5, "chunks": len(chunks), "status": "ingested and indexed", "chunk_size": chunk_size, "chunk_overlap": chunk_overlap}


# Create a new chat session
@app.post(
    "/chat/session",
    summary="Create chat session",
    description="Create a new chat session for multi-turn conversations. Returns a session ID."
)
def create_session():
    session_id = create_chat_session()
    return {"session_id": session_id}

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
    # Save user message
    add_chat_message(session_id, "user", message)
    # Get last 10 messages for context
    history = get_last_messages(session_id, limit=10)
    context = "\n".join([f"{m.role}: {m.message}" for m in history if m.role == "user" or m.role == "assistant"])
    # Get LLM response
    answer = litellm_client.ask(message, context=context)
    # Save assistant message
    add_chat_message(session_id, "assistant", answer)
    return {"answer": answer, "session_id": session_id, "history": [{"role": m.role, "message": m.message} for m in history]}

@app.post(
    "/ask",
    summary="Ask question on document",
    description="Ask a question about an uploaded document. Performs semantic search and uses LLM to answer based on document content."
)
async def ask_question(
    document_name: str = Form(..., description="Filename of the uploaded document (with extension)"),
    question: str = Form(..., description="Question to ask about the document")
):
    # Now document_name is the full filename with extension
    meta = get_document_meta(document_name)
    import logging
    logging.info(f"Document metadata: {meta}")
    if not meta:
        return {"answer": "Document not found or not indexed."}
    # Use ChromaDB for semantic search (use base name without extension for doc_name)
    doc_base = os.path.splitext(document_name)[0]
    results = vectordb.search(doc_base, question, top_k=3)
    if not results:
        return {"answer": "No relevant content found."}
    context = "\n".join(results)
    answer = litellm_client.ask(question, context=context)
    return {"answer": answer, "context": results}


from fastapi import status

# List all uploaded files and metadata
@app.get(
    "/files",
    summary="List uploaded files",
    description="List all uploaded documents and their metadata."
)
def list_files():
    db = SessionLocal()
    files = db.query(DocumentMeta).all()
    db.close()
    return [
        {
            "filename": f.filename,
            "md5": f.md5,
            "filetype": f.filetype,
            "status": f.status,
            "extra": f.extra
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
