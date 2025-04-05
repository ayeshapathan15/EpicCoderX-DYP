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
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
# Configuration
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max upload

# MongoDB connection setup
try:
    mongo_client = MongoClient("mongodb://localhost:27017/")
    db = mongo_client["mediscan_db"]
    patient_reports = db["patient_reports"]
    logging.info("Connected to MongoDB")
except Exception as e:
    logging.error(f"Failed to connect to MongoDB: {e}")
    mongo_client = None
    db = None

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
    
    # Get patient ID if provided
    patient_id = request.form.get('patient_id', '')
    
    try:
        # Process the scan using the core functions
        result, error = process_scan(scan_path, report_text)
        
        if error:
            return jsonify({'error': error}), 500
        
        # Store result in MongoDB if we have a patient ID and database connection
        if patient_id and db is not None:
            try:
                # Create a document to store in MongoDB
                report_document = {
                    "patient_id": patient_id,
                    "scan_filename": scan_file.filename,
                    "report_text": report_text,
                    "analysis_result": result,
                    "created_at": datetime.now(),
                    "anomaly_detected": result.get("anomaly_detection", {}).get("anomaly_detected", False)
                }
                
                # Insert the document into MongoDB
                report_id = patient_reports.insert_one(report_document).inserted_id
                logging.info(f"Stored report with ID {report_id} for patient {patient_id}")
                
                # Add the MongoDB ID to the result
                result["report_id"] = str(report_id)
                
            except Exception as db_error:
                logging.error(f"Failed to store report in database: {db_error}")
                # We don't want to fail the API call if DB storage fails
        
        return jsonify(result)
    
    finally:
        # Clean up the uploaded file
        if os.path.exists(scan_path):
            os.remove(scan_path)

@app.route('/api/patient/<patient_id>/reports', methods=['GET'])
def get_patient_reports(patient_id):
    """
    Retrieve all reports for a specific patient
    
    URL Parameters:
    - patient_id: The ID of the patient
    
    Query Parameters:
    - limit: Maximum number of reports to return (default: 100)
    - skip: Number of reports to skip (for pagination, default: 0)
    - sort: Field to sort by (default: created_at)
    - order: Sort order (asc or desc, default: desc)
    """
    if not db:
        return jsonify({"error": "Database connection is not available"}), 500
    
    # Parse query parameters
    try:
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
    except ValueError:
        return jsonify({"error": "Invalid limit or skip parameters"}), 400
    
    sort_field = request.args.get('sort', 'created_at')
    sort_order = request.args.get('order', 'desc')
    sort_direction = -1 if sort_order.lower() == 'desc' else 1
    
    try:
        # Query MongoDB for patient reports
        cursor = patient_reports.find(
            {"patient_id": patient_id}
        ).sort(
            sort_field, sort_direction
        ).skip(skip).limit(limit)
        
        # Convert MongoDB documents to JSON-serializable format
        reports = []
        for doc in cursor:
            # Convert ObjectId to string
            doc['_id'] = str(doc['_id'])
            # Convert datetime objects to strings
            if 'created_at' in doc:
                doc['created_at'] = doc['created_at'].isoformat()
            reports.append(doc)
        
        # Get total count
        total_reports = patient_reports.count_documents({"patient_id": patient_id})
        
        return jsonify({
            "patient_id": patient_id,
            "reports": reports,
            "total": total_reports,
            "limit": limit,
            "skip": skip
        })
    
    except Exception as e:
        logging.error(f"Error retrieving patient reports: {e}")
        return jsonify({"error": f"Failed to retrieve patient reports: {str(e)}"}), 500

@app.route('/api/report/<report_id>', methods=['GET'])
def get_report_by_id(report_id):
    """
    Retrieve a specific report by its ID
    
    URL Parameters:
    - report_id: The MongoDB ID of the report
    """
    if not db:
        return jsonify({"error": "Database connection is not available"}), 500
    
    try:
        # Convert string ID to MongoDB ObjectId
        object_id = ObjectId(report_id)
        
        # Query MongoDB for the specific report
        report = patient_reports.find_one({"_id": object_id})
        
        if not report:
            return jsonify({"error": "Report not found"}), 404
        
        # Convert ObjectId to string
        report['_id'] = str(report['_id'])
        # Convert datetime objects to strings
        if 'created_at' in report:
            report['created_at'] = report['created_at'].isoformat()
        
        return jsonify(report)
    
    except Exception as e:
        logging.error(f"Error retrieving report: {e}")
        return jsonify({"error": f"Failed to retrieve report: {str(e)}"}), 500

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
    # Extend health check to include MongoDB connection status
    health_status = check_health()
    
    # Add MongoDB status
    health_status["mongodb_connected"] = db is not None
    
    return jsonify(health_status)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)