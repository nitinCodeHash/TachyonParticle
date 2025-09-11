import os
from PyPDF2 import PdfReader

def extract_metadata(file_path: str) -> dict:
    metadata = {"author": None, "title": None, "creation_date": None}
    try:
        reader = PdfReader(file_path)
        doc_info = reader.metadata or reader.getDocumentInfo() if hasattr(reader, 'getDocumentInfo') else None
        if doc_info:
            metadata["author"] = getattr(doc_info, 'author', None) or doc_info.get('/Author')
            metadata["title"] = getattr(doc_info, 'title', None) or doc_info.get('/Title')
            metadata["creation_date"] = getattr(doc_info, 'creation_date', None) or doc_info.get('/CreationDate')
    except Exception:
        pass
    return metadata

def is_pdf(file_path: str) -> bool:
    return os.path.splitext(file_path)[1].lower() == ".pdf"
