
# FastAPI RAG System

This project is a Retrieval-Augmented Generation (RAG) backend built with Python and FastAPI. It provides robust API endpoints for document ingestion (PDF, DOCX, TXT, images with OCR), semantic search, and chat-based question answering using LLMs (OpenAI, Gemini, etc.) via LiteLLM.

## Features
- Document ingestion with validation (file name, md5, uniqueness, type, etc.)
- OCR for image files (EasyOCR)
- Chunking and embedding with configurable parameters
- Persistent vector storage (Qdrant)
- Semantic search and retrieval
- Chat API with session/history and context window
- Modular LLM backend via LiteLLM (OpenAI, Gemini, etc.)
- File management endpoints (list, delete)

## Endpoints
- `POST /ingest`: Upload and ingest documents (PDF, DOCX, TXT, or image; OCR for images; supports chunk_size and chunk_overlap params)
- `POST /ask`: Ask a question about an uploaded document (semantic search + LLM answer)
- `POST /chat/session`: Create a new chat session (returns session_id)
- `POST /chat`: Chat with LLM using session and history (multi-turn, context-aware)
- `GET /files`: List all uploaded files and metadata
- `DELETE /files/{filename}`: Delete a file, its metadata, and all vectors

## Setup
1. Create a virtual environment:
   ```sh
   python -m venv venv
   ```
2. Activate the environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Set environment variables for your LLM provider:
   - For OpenAI: `OPENAI_API_KEY=sk-...`
   - For Gemini: `GEMINI_API_KEY=...`
   - (Optional) `LITELLM_MODEL=gpt-3.5-turbo` (or your preferred model)
5. Run the server:
   ```sh
   uvicorn app.main:app --reload
   ```

## Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (for OpenAI models)
- `GEMINI_API_KEY`: Your Gemini API key (for Gemini models)
- `LITELLM_MODEL`: (Optional) Default LLM model name (e.g., gpt-3.5-turbo)

## Notes
- Ensure Tesseract is installed for OCR support (for EasyOCR)
- Qdrant runs in local file mode by default (no external server needed)
- All LLM calls are routed through LiteLLM for easy provider/model swap

## Major Dependencies
- FastAPI, Uvicorn
- SQLAlchemy (SQLite metadata)
- Qdrant-client (vector DB)
- LangChain, sentence-transformers (embedding, chunking)
- EasyOCR, pytesseract (OCR)
- LiteLLM (LLM abstraction)

---
For more details, see the code and endpoint docs at `/docs` (Swagger UI).
