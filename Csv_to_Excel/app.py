from flask import Flask, request, jsonify, send_file
import os
import pandas as pd

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


@app.route('/')
def home():
    return "Flask server is running. Use /upload to upload a file."


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Read CSV and generate preview
    df = pd.read_csv(file_path, nrows=5)  # Read first 5 rows
    preview_data = {
        "headers": df.columns.tolist(),
        "rows": df.values.tolist()
    }

    return jsonify({'message': 'File uploaded successfully', 'preview': preview_data})

@app.route('/process', methods=['POST'])
def process_file():
    data = request.get_json()
    remove_duplicates = data.get('removeDuplicates', False)
    fill_missing = data.get('fillMissing', False)
    file_format = data.get('format', 'csv')

    # Get latest uploaded file
    files = os.listdir(UPLOAD_FOLDER)
    if not files:
        return jsonify({'error': 'No file uploaded yet'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, files[-1])
    df = pd.read_csv(file_path)

    # Apply processing
    if remove_duplicates:
        df.drop_duplicates(inplace=True)

    if fill_missing:
        df.fillna("N/A", inplace=True)

    processed_file_path = os.path.join(PROCESSED_FOLDER, f'processed_file.{file_format}')
    if file_format == 'csv':
        df.to_csv(processed_file_path, index=False)
    elif file_format == 'xlsx':
        df.to_excel(processed_file_path, index=False)

    return send_file(processed_file_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
