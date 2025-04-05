# main.py
import os
from flask import Flask, request, jsonify
import logging
from report_scan import (
    process_scan, 
    check_health, 
    allowed_file,
    UPLOAD_FOLDER
)
from compare import compare_medical_documents, allowed_file

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max upload

@app.route('/api/analyze', methods=['POST'])
def analyze_scan():
    # Check if image is present in the request
    if 'scan' not in request.files:
        return jsonify({'error': 'No scan file provided'}), 400
    
    scan_file = request.files['scan']
    
    # Check if filename is valid
    if scan_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(scan_file.filename):
        return jsonify({'error': f'File type not allowed. Supported types: png, jpg, jpeg, dcm, nii, nii.gz'}), 400
    
    # Save the uploaded file
    scan_path = os.path.join(app.config['UPLOAD_FOLDER'], scan_file.filename)
    scan_file.save(scan_path)
    
    # Process report if available
    report_text = None
    if 'report' in request.files:
        report_file = request.files['report']
        if report_file.filename != '':
            report_text = report_file.read().decode('utf-8')
    
    # Alternatively, accept report text directly
    elif 'report_text' in request.form:
        report_text = request.form['report_text']
    
    try:
        # Process the scan using the core functions
        result, error = process_scan(scan_path, report_text)
        
        if error:
            return jsonify({'error': error}), 500
        
        return jsonify(result)
    
    finally:
        # Clean up the uploaded file
        if os.path.exists(scan_path):
            os.remove(scan_path)

@app.route('/api/compare', methods=['POST'])
def compare_documents():
    """
    API endpoint to compare multiple medical documents and generate progress reports
    
    Expected multipart form data:
    - doc1: First document file (PDF, text, image)
    - doc2: Second document file (PDF, text, image)
    - doc3, doc4, etc.: Additional documents (optional)
    
    OR
    
    - docs: JSON array of document content (for text-based documents)
    
    Returns a JSON with comparison results and progress report
    """
    documents = []
    
    # Check if files are present in the request
    if request.files:
        # Process uploaded files
        doc_files = [f for f in request.files if f.startswith('doc')]
        
        if len(doc_files) < 2:
            return jsonify({'error': 'At least two documents are required for comparison'}), 400
        
        for doc_key in doc_files:
            file = request.files[doc_key]
            
            # Check if filename is valid
            if file.filename == '':
                continue
            
            if not allowed_file(file.filename):
                return jsonify({'error': f'File type not allowed for {doc_key}. Supported types: pdf, txt, jpg, jpeg, png, dcm'}), 400
            
            # Read file content
            file_content = file.read()
            file_type = file.filename.rsplit('.', 1)[1].lower()
            
            documents.append({
                'name': file.filename,
                'type': file_type,
                'content': file_content
            })
    
    # Check if text-based documents are provided in JSON format
    elif request.json and 'docs' in request.json:
        json_docs = request.json['docs']
        
        if len(json_docs) < 2:
            return jsonify({'error': 'At least two documents are required for comparison'}), 400
        
        for doc in json_docs:
            if 'content' not in doc or 'name' not in doc:
                return jsonify({'error': 'Each document must have content and name fields'}), 400
            
            # For text documents
            documents.append({
                'name': doc['name'],
                'type': 'txt',
                'content': doc['content']
            })
    
    else:
        return jsonify({'error': 'No documents provided for comparison'}), 400
    
    # Ensure we have at least 2 documents
    if len(documents) < 2:
        return jsonify({'error': 'At least two valid documents are required for comparison'}), 400
    
    try:
        # Compare documents and generate report
        result = compare_medical_documents(documents)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in document comparison endpoint: {e}")
        return jsonify({'error': f'Comparison failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify(check_health())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)