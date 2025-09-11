import json

import os
import hashlib
from fastapi import UploadFile, HTTPException
from typing import Any
from PIL import Image
from app.helpers.ocr import ocr_image
from app.rag_file_types.pdf_handler import extract_metadata as extract_pdf_metadata, is_pdf
from app.rag_file_types.docx_handler import extract_metadata as extract_docx_metadata, is_docx
from app.rag_file_types.txt_handler import extract_metadata as extract_txt_metadata, is_txt
from app.rag_file_types.image_handler import extract_metadata as extract_image_metadata, is_image
from PyPDF2 import PdfReader
from docx import Document



def validate_file(file: UploadFile):
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "image/png", "image/jpeg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")
    if len(file.filename) > 128:
        raise HTTPException(status_code=400, detail="File name too long.")

def get_file_md5(file_bytes: bytes) -> str:
    return hashlib.md5(file_bytes).hexdigest()

from app.db import SessionLocal, DocumentMeta

def is_file_unique(md5: str, upload_dir: str) -> bool:
    db = SessionLocal()
    exists = db.query(DocumentMeta).filter(DocumentMeta.md5 == md5).first()
    db.close()
    return not bool(exists)

def save_file(file: UploadFile, file_bytes: bytes, upload_dir: str) -> str:
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return file_path

def extract_text_from_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif ext == ".docx":
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    elif ext in [".png", ".jpg", ".jpeg"]:
        # OCR: extract text from image for downstream embedding using easyocr
        text = ocr_image(file_path)
        return text
    else:
        raise HTTPException(status_code=400, detail="Unsupported file extension for text extraction.")


def extract_metadata_from_file(file_path: str) -> dict:
    if is_pdf(file_path):
        return extract_pdf_metadata(file_path)
    elif is_docx(file_path):
        return extract_docx_metadata(file_path)
    elif is_txt(file_path):
        return extract_txt_metadata(file_path)
    elif is_image(file_path):
        return extract_image_metadata(file_path)
    else:
        return {"author": None, "title": None, "creation_date": None}