# compare.py
import os
import re
import fitz  # PyMuPDF
import numpy as np
import tempfile
from typing import List, Dict, Tuple, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define constants
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'jpg', 'jpeg', 'png', 'dcm'}
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize the sentence transformer model (lightweight)
model = SentenceTransformer('all-MiniLM-L6-v2')  # Small model (~80MB) that runs on CPU

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file"""
    try:
        text = ""
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_document(file_path: str) -> str:
    """Extract text from various document types"""
    if file_path.endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif file_path.endswith('.txt'):
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif file_path.endswith(('.jpg', '.jpeg', '.png')):
        # For image files, we'd ideally use OCR here
        # This is a placeholder for now
        return "Image file - text extraction not implemented"
    elif file_path.endswith('.dcm'):
        # For DICOM files, we'd need pydicom to extract metadata
        # This is a placeholder for now
        return "DICOM file - text extraction not implemented"
    else:
        return ""

def vectorize_document(text: str) -> np.ndarray:
    """Convert document text to a vector representation"""
    return model.encode([text])[0]

def compare_documents(doc1_vector: np.ndarray, doc2_vector: np.ndarray) -> float:
    """Compare two document vectors using cosine similarity"""
    similarity = cosine_similarity([doc1_vector], [doc2_vector])[0][0]
    return float(similarity)

def extract_medical_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract medical entities from text using regex patterns
    This is a simple implementation - in production, you'd use a medical NER model
    """
    entities = {
        "conditions": [],
        "treatments": [],
        "measurements": [],
        "findings": []
    }
    
    # Simple patterns for demonstration
    condition_patterns = [
        r"(?i)(diagnosed with|suffering from|presents with|history of) ([A-Za-z\s]+)",
        r"(?i)(fracture|tumor|cancer|infection|disease|syndrome|disorder)"
    ]
    
    treatment_patterns = [
        r"(?i)(treated with|prescribed|administered) ([A-Za-z\s]+)",
        r"(?i)(surgery|medication|therapy|treatment|procedure)"
    ]
    
    measurement_patterns = [
        r"(?i)(\d+\.?\d*)\s*(mm|cm|ml|mg|kg)",
        r"(?i)(size|volume|measurement|dimension)[:;]\s*([A-Za-z0-9\s\.]+)"
    ]
    
    finding_patterns = [
        r"(?i)(observed|noted|found|revealed|shows) ([A-Za-z\s]+)",
        r"(?i)(normal|abnormal|improved|worsened|unchanged)"
    ]
    
    # Extract conditions
    for pattern in condition_patterns:
        matches = re.findall(pattern, text)
        if matches:
            entities["conditions"].extend([match[-1].strip() for match in matches])
    
    # Extract treatments
    for pattern in treatment_patterns:
        matches = re.findall(pattern, text)
        if matches:
            entities["treatments"].extend([match[-1].strip() for match in matches])
    
    # Extract measurements
    for pattern in measurement_patterns:
        matches = re.findall(pattern, text)
        if matches:
            entities["measurements"].extend([" ".join(match).strip() for match in matches])
    
    # Extract findings
    for pattern in finding_patterns:
        matches = re.findall(pattern, text)
        if matches:
            entities["findings"].extend([match[-1].strip() for match in matches])
    
    # Remove duplicates
    for key in entities:
        entities[key] = list(set(entities[key]))
    
    return entities

def identify_changes(old_entities: Dict[str, List[str]], new_entities: Dict[str, List[str]]) -> Dict[str, Dict[str, List[str]]]:
    """Identify changes between two sets of medical entities"""
    changes = {
        "added": {},
        "removed": {}
    }
    
    for category in old_entities:
        # Find added entities (in new but not in old)
        added = [item for item in new_entities.get(category, []) 
                if item not in old_entities.get(category, [])]
        if added:
            changes["added"][category] = added
        
        # Find removed entities (in old but not in new)
        removed = [item for item in old_entities.get(category, []) 
                  if item not in new_entities.get(category, [])]
        if removed:
            changes["removed"][category] = removed
    
    return changes

def generate_progress_report(old_doc: str, new_doc: str, similarity: float, changes: Dict) -> Dict:
    """Generate a progress report based on document comparison"""
    report = {
        "similarity_score": similarity,
        "similarity_interpretation": "",
        "changes": changes,
        "progress_summary": "",
        "treatment_recommendations": []
    }
    
    # Interpret similarity score
    if similarity > 0.9:
        report["similarity_interpretation"] = "The documents are highly similar, suggesting minimal changes in condition."
    elif similarity > 0.7:
        report["similarity_interpretation"] = "The documents show moderate similarity, indicating some changes in the patient's condition."
    elif similarity > 0.5:
        report["similarity_interpretation"] = "The documents have significant differences, suggesting substantial changes in the patient's condition."
    else:
        report["similarity_interpretation"] = "The documents are vastly different, indicating major changes or potentially different patients/conditions."
    
    # Generate progress summary
    added_conditions = changes["added"].get("conditions", [])
    removed_conditions = changes["removed"].get("conditions", [])
    added_findings = changes["added"].get("findings", [])
    removed_findings = changes["removed"].get("findings", [])
    
    # Generate progress summary
    summary_parts = []
    
    if removed_conditions:
        summary_parts.append(f"Previously identified conditions no longer present: {', '.join(removed_conditions)}.")
    
    if added_conditions:
        summary_parts.append(f"Newly identified conditions: {', '.join(added_conditions)}.")
    
    if removed_findings:
        summary_parts.append(f"Previous findings no longer present: {', '.join(removed_findings)}.")
    
    if added_findings:
        summary_parts.append(f"New findings: {', '.join(added_findings)}.")
    
    if summary_parts:
        report["progress_summary"] = " ".join(summary_parts)
    else:
        report["progress_summary"] = "No significant changes in conditions or findings were detected."
    
    # Generate treatment recommendations (simplified for demonstration)
    if added_conditions or added_findings:
        report["treatment_recommendations"].append("Further evaluation recommended for newly identified conditions/findings.")
    
    if removed_conditions or removed_findings:
        report["treatment_recommendations"].append("Current treatment approach may be effective; consider continuing current regimen.")
    
    if not report["treatment_recommendations"]:
        report["treatment_recommendations"].append("No specific treatment changes recommended based on document comparison.")
    
    return report

def save_file_temporarily(file_content: bytes, file_extension: str) -> str:
    """Save a file temporarily and return the path"""
    fd, path = tempfile.mkstemp(suffix=f'.{file_extension}')
    with os.fdopen(fd, 'wb') as tmp:
        tmp.write(file_content)
    return path

def compare_medical_documents(docs: List[Dict[str, Any]]) -> Dict:
    """
    Compare multiple medical documents and generate a progress report
    
    Args:
        docs: A list of dictionaries with document content and metadata
              Each dict should have: 
              - 'content': bytes or string content of the document
              - 'type': file type (e.g., 'pdf', 'txt')
              - 'name': filename or identifier
    
    Returns:
        Dict containing comparison results and progress report
    """
    if len(docs) < 2:
        return {"error": "At least two documents are required for comparison"}
    
    try:
        # Extract text from documents
        docs_text = []
        docs_paths = []
        
        for doc in docs:
            if isinstance(doc['content'], bytes):
                # Save file temporarily and extract text
                path = save_file_temporarily(doc['content'], doc['type'])
                docs_paths.append(path)
                text = extract_text_from_document(path)
            else:
                # Content is already text
                text = doc['content']
            
            docs_text.append(text)
        
        # Vectorize documents
        doc_vectors = [vectorize_document(text) for text in docs_text]
        
        # Compare chronologically (assumes docs are in chronological order)
        results = {
            "overall_similarity": None,
            "pairwise_comparisons": [],
            "progress_report": None
        }
        
        # Calculate similarity between consecutive documents
        similarities = []
        for i in range(len(doc_vectors) - 1):
            similarity = compare_documents(doc_vectors[i], doc_vectors[i+1])
            similarities.append(similarity)
            
            # Extract medical entities from the documents
            old_entities = extract_medical_entities(docs_text[i])
            new_entities = extract_medical_entities(docs_text[i+1])
            
            # Identify changes
            changes = identify_changes(old_entities, new_entities)
            
            # Generate progress report for this pair
            report = generate_progress_report(docs_text[i], docs_text[i+1], similarity, changes)
            
            results["pairwise_comparisons"].append({
                "old_doc": docs[i]['name'],
                "new_doc": docs[i+1]['name'],  
                "similarity": similarity,
                "changes": changes,
                "report": report
            })
        
        # Calculate overall similarity (average of pairwise similarities)
        if similarities:
            results["overall_similarity"] = sum(similarities) / len(similarities)
        
        # Generate overall progress report (based on first and last document)
        if len(docs) >= 2:
            old_doc = docs_text[0]
            new_doc = docs_text[-1]
            old_entities = extract_medical_entities(old_doc)
            new_entities = extract_medical_entities(new_doc)
            changes = identify_changes(old_entities, new_entities)
            overall_similarity = compare_documents(doc_vectors[0], doc_vectors[-1])
            
            results["progress_report"] = generate_progress_report(old_doc, new_doc, overall_similarity, changes)
        
        return results
        
    except Exception as e:
        logger.error(f"Error in document comparison: {e}")
        return {"error": f"Document comparison failed: {str(e)}"}
    
    finally:
        # Clean up temporary files
        for path in docs_paths:
            if os.path.exists(path):
                os.remove(path)