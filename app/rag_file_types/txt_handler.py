import os

def extract_metadata(file_path: str) -> dict:
    metadata = {"author": None, "title": os.path.basename(file_path), "creation_date": None}
    try:
        stat = os.stat(file_path)
        metadata["creation_date"] = str(stat.st_ctime)
    except Exception:
        pass
    return metadata

def is_txt(file_path: str) -> bool:
    return os.path.splitext(file_path)[1].lower() == ".txt"
