import os
from docx import Document

def extract_metadata(file_path: str) -> dict:
    metadata = {"author": None, "title": None, "creation_date": None}
    try:
        doc = Document(file_path)
        core = doc.core_properties
        metadata["author"] = core.author
        metadata["title"] = core.title
        metadata["creation_date"] = str(core.created) if core.created else None
    except Exception:
        pass
    return metadata

def is_docx(file_path: str) -> bool:
    return os.path.splitext(file_path)[1].lower() == ".docx"
