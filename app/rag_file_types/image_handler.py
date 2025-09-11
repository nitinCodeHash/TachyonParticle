import os
from PIL import Image

def extract_metadata(file_path: str) -> dict:
    metadata = {"author": None, "title": os.path.basename(file_path), "creation_date": None, "format": None, "size": None}
    try:
        stat = os.stat(file_path)
        metadata["creation_date"] = str(stat.st_ctime)
        with Image.open(file_path) as img:
            metadata["format"] = img.format
            metadata["size"] = img.size
    except Exception:
        pass
    return metadata

def is_image(file_path: str) -> bool:
    return os.path.splitext(file_path)[1].lower() in [".png", ".jpg", ".jpeg"]
