import pytesseract as pyt
from PIL import Image   

# Set Tesseract OCR path


pyt.pytesseract.tesseract_cmd = r'E:\Projects\Text_extractor_from_image\tesseract.exe'

# Load image
img = Image.open('img2.jpg')

img.load()


# Perform OCR with multiple languages
text = pyt.image_to_string( img )

print(text)

with open('urdu.txt', 'w', encoding='utf-8') as f:
    f.write(text)