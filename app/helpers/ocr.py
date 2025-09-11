import easyocr
from PIL import Image

def ocr_image(file_path: str, lang: str = 'en') -> str:
    reader = easyocr.Reader([lang], gpu=False)
    result = reader.readtext(file_path, detail=0, paragraph=True)
    return "\n".join(result)
