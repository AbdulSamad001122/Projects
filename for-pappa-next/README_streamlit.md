## Streamlit Version (Local/Desktop)

This Streamlit app mirrors your Next.js API's features:

- Upload XLSX
- Group rows by a selected column (default: `Del.Challan`)
- Generate one PDF per group (no browser needed)
- (Optional) Upload generated PDFs/XLSX to Cloudinary

### Setup

1) Python 3.10+
2) Create a virtual environment and install deps:
```
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
```

3) Set Cloudinary env vars (if you want uploads):
```
# PowerShell
$env:CLOUDINARY_CLOUD_NAME = "your_cloud_name"
$env:CLOUDINARY_API_KEY = "your_api_key"
$env:CLOUDINARY_API_SECRET = "your_api_secret"
```

### Run
```
streamlit run streamlit_app.py
```
Open the browser link Streamlit prints.

### Notes

- PDFs are created with ReportLab (no Chromium).
- For very wide tables, cells are truncated to keep PDFs readable.
- The app shows links returned by Cloudinary when uploads are enabled.


