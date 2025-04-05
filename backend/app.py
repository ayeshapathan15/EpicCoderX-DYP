# app.py
# Flask API endpoints for medical scan analysis

import os
from flask import Flask, request, jsonify
import logging
from report_scan import (
    process_scan, 
    check_health, 
    allowed_file,
    UPLOAD_FOLDER
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify(check_health())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)