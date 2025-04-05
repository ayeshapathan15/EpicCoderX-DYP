# compare.py
import os
import re
import fitz  # PyMuPDF
import numpy as np
from typing import List, Dict, Tuple, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import logging
import json
import tempfile

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
        "findings": [],
        "recovery_indicators": []
    }
    
    # Simple patterns for demonstration
    condition_patterns = [
        r"(?i)(diagnosed with|suffering from|presents with|history of) ([A-Za-z\s]+)",
        r"(?i)(fracture|tumor|cancer|infection|disease|syndrome|disorder)"
    ]
    
    treatment_patterns = [
        r"(?i)(treated with|prescribed|administered) ([A-Za-z\s]+)",
        r"(?i)(surgery|medication|therapy|treatment|procedure|immobilization)"
    ]
    
    measurement_patterns = [
        r"(?i)(\d+\.?\d*)\s*(mm|cm|ml|mg|kg)",
        r"(?i)(size|volume|measurement|dimension)[:;]\s*([A-Za-z0-9\s\.]+)"
    ]
    
    finding_patterns = [
        r"(?i)(observed|noted|found|revealed|shows) ([A-Za-z\s]+)",
        r"(?i)(normal|abnormal|improved|worsened|unchanged)"
    ]
    
    # New patterns specifically for recovery indicators
    recovery_patterns = [
        r"(?i)(healing|recovery|improvement|progress|regrowth|regeneration)",
        r"(?i)(callus formation|bone regrowth|signs of healing)",
        r"(?i)(partial recovery|early healing|slight improvement)",
        r"(?i)(decreased pain|increased mobility|better function)"
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
    
    # Extract recovery indicators
    for pattern in recovery_patterns:
        matches = re.findall(pattern, text)
        if matches:
            # For recovery indicators, we want the full match
            if isinstance(matches[0], tuple):
                entities["recovery_indicators"].extend([match[-1].strip() for match in matches])
            else:
                entities["recovery_indicators"].extend([match.strip() for match in matches])
    
    # Remove duplicates
    for key in entities:
        entities[key] = list(set(entities[key]))
    
    return entities

def identify_changes(old_entities: Dict[str, List[str]], new_entities: Dict[str, List[str]]) -> Dict[str, Dict[str, List[str]]]:
    """Identify changes between two sets of medical entities"""
    changes = {
        "added": {},
        "removed": {},
        "persisting": {}
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
            
        # Find persisting entities (in both old and new)
        persisting = [item for item in old_entities.get(category, [])
                     if item in new_entities.get(category, [])]
        if persisting:
            changes["persisting"][category] = persisting
    
    return changes

def extract_severity_indicators(text: str) -> Dict[str, List[str]]:
    """Extract indicators of severity and improvement from text"""
    indicators = {
        "severity": [],
        "improvement": []
    }
    
    # Severity patterns
    severity_patterns = [
        r"(?i)(severe|significant|major|extensive|substantial|complete) (fracture|break|damage|injury|disruption)",
        r"(?i)(shows|reveals|indicates) a (?:severe|significant|major) (fracture|break|damage)"
    ]
    
    # Improvement patterns
    improvement_patterns = [
        r"(?i)(minor|slight|partial|early|promising) (signs of healing|improvement|recovery|bone regrowth)",
        r"(?i)(callus formation|bone regeneration|healing process)",
        r"(?i)(improved|better|recovered|healed) (partially|slightly|significantly|completely)"
    ]
    
    # Extract severity indicators
    for pattern in severity_patterns:
        matches = re.findall(pattern, text)
        if matches:
            indicators["severity"].extend([" ".join(match).strip() for match in matches])
    
    # Extract improvement indicators
    for pattern in improvement_patterns:
        matches = re.findall(pattern, text)
        if matches:
            indicators["improvement"].extend([" ".join(match).strip() for match in matches])
    
    # Remove duplicates
    for key in indicators:
        indicators[key] = list(set(indicators[key]))
    
    return indicators

def estimate_recovery_percentage(old_text: str, new_text: str, changes: Dict) -> Dict:
    """
    Estimate recovery percentage based on textual analysis and entity changes
    
    This is a more advanced function that analyzes text for recovery indicators
    and provides percentage estimates based on them
    """
    recovery_metrics = {
        "overall_recovery_percentage": 0,
        "bone_healing_percentage": 0, 
        "symptoms_improvement_percentage": 0,
        "key_indicators": []
    }
    
    # Extract severity and improvement indicators
    old_indicators = extract_severity_indicators(old_text)
    new_indicators = extract_severity_indicators(new_text)
    
    # Count recovery indicators
    recovery_indicators = changes.get("added", {}).get("recovery_indicators", [])
    n_recovery_indicators = len(recovery_indicators)
    
    # Look for specific phrases indicating recovery percentages
    percentage_patterns = [
        r"(\d+)(?:\s*)%(?:\s*)(healing|recovery|improvement|progress)",
        r"(healing|recovery|improvement|progress)(?:\s*)(?:is|at)(?:\s*)(\d+)(?:\s*)%"
    ]
    
    explicit_percentages = []
    for pattern in percentage_patterns:
        for text in [old_text, new_text]:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    # Extract percentage regardless of pattern order
                    if match[0].isdigit():
                        percentage = int(match[0])
                        indicator = match[1]
                    else:
                        percentage = int(match[1])
                        indicator = match[0]
                    
                    explicit_percentages.append((percentage, indicator))
                except (ValueError, IndexError):
                    continue
    
    # If we found explicit percentages, use them
    if explicit_percentages:
        total = sum(pct for pct, _ in explicit_percentages)
        if explicit_percentages:
            recovery_metrics["overall_recovery_percentage"] = min(round(total / len(explicit_percentages)), 100)
            recovery_metrics["key_indicators"] = [f"{pct}% {ind}" for pct, ind in explicit_percentages]
    
    # Otherwise, calculate based on heuristics
    else:
        # Basic indicators from improvements
        improvement_score = 0
        
        # Check for early stage healing indicators
        early_healing = any(re.search(r"early|slight|minor", i) for i in new_indicators.get("improvement", []))
        if early_healing:
            improvement_score += 20
            recovery_metrics["key_indicators"].append("Early stage healing detected")
        
        # Check for partial recovery indicators
        partial_recovery = any(re.search(r"partial|some|better", i) for i in new_indicators.get("improvement", []))
        if partial_recovery:
            improvement_score += 40
            recovery_metrics["key_indicators"].append("Partial recovery indicators found")
        
        # Check for significant recovery indicators
        significant_recovery = any(re.search(r"significant|substantial|major", i) for i in new_indicators.get("improvement", []))
        if significant_recovery:
            improvement_score += 60
            recovery_metrics["key_indicators"].append("Significant recovery indicators found")
        
        # If we found callus formation specifically (important in bone healing)
        callus_formation = any(re.search(r"callus formation", text) for text in [new_text])
        if callus_formation:
            improvement_score += 25
            recovery_metrics["bone_healing_percentage"] = 25
            recovery_metrics["key_indicators"].append("Callus formation detected (25% bone healing)")
        
        # If severity decreased in follow-up
        if len(old_indicators.get("severity", [])) > len(new_indicators.get("severity", [])):
            improvement_score += 15
            recovery_metrics["key_indicators"].append("Decreased severity indicators")
        
        # Adjust based on recovery indicators found
        if n_recovery_indicators > 0:
            adjustment = min(n_recovery_indicators * 10, 30)  # Cap at 30%
            improvement_score += adjustment
            recovery_metrics["key_indicators"].append(f"Found {n_recovery_indicators} recovery indicators (+{adjustment}%)")
        
        # Set overall recovery percentage
        recovery_metrics["overall_recovery_percentage"] = min(improvement_score, 100)
        
        # Set bone healing percentage if not already set
        if recovery_metrics["bone_healing_percentage"] == 0:
            # Look for specific bone healing indicators
            bone_healing_indicators = [
                i for i in new_indicators.get("improvement", []) 
                if re.search(r"bone|fracture|callus|regrowth", i)
            ]
            
            if bone_healing_indicators:
                recovery_metrics["bone_healing_percentage"] = min(len(bone_healing_indicators) * 15, 100)
        
        # Estimate symptoms improvement
        symptom_improvements = [
            i for i in new_indicators.get("improvement", [])
            if re.search(r"pain|function|mobility|movement", i)
        ]
        
        if symptom_improvements:
            recovery_metrics["symptoms_improvement_percentage"] = min(len(symptom_improvements) * 20, 100)
    
    # If no improvement percentage has been calculated yet, derive from overall
    if recovery_metrics["bone_healing_percentage"] == 0:
        recovery_metrics["bone_healing_percentage"] = max(0, recovery_metrics["overall_recovery_percentage"] - 5)
    
    if recovery_metrics["symptoms_improvement_percentage"] == 0:
        recovery_metrics["symptoms_improvement_percentage"] = max(0, recovery_metrics["overall_recovery_percentage"] - 10)
    
    return recovery_metrics

def generate_progress_report(old_doc: str, new_doc: str, similarity: float, changes: Dict) -> Dict:
    """Generate a progress report based on document comparison"""
    report = {
        "similarity_score": similarity,
        "similarity_interpretation": "",
        "changes": changes,
        "progress_summary": "",
        "recovery_metrics": {},
        "treatment_recommendations": []
    }
    
    # Calculate recovery metrics
    recovery_metrics = estimate_recovery_percentage(old_doc, new_doc, changes)
    report["recovery_metrics"] = recovery_metrics
    
    # Interpret similarity score
    if similarity > 0.9:
        report["similarity_interpretation"] = "The documents are highly similar, but they may still contain important differences in medical details."
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
    recovery_indicators = changes["added"].get("recovery_indicators", [])
    
    # Generate progress summary
    summary_parts = []
    
    if recovery_metrics["overall_recovery_percentage"] > 0:
        summary_parts.append(f"Patient shows approximately {recovery_metrics['overall_recovery_percentage']}% overall recovery from the initial condition.")
    
    if recovery_metrics["bone_healing_percentage"] > 0:
        summary_parts.append(f"Bone healing is estimated at {recovery_metrics['bone_healing_percentage']}%.")
    
    if recovery_metrics["symptoms_improvement_percentage"] > 0:
        summary_parts.append(f"Symptoms have improved by approximately {recovery_metrics['symptoms_improvement_percentage']}%.")
    
    if removed_conditions:
        summary_parts.append(f"Previously identified conditions no longer present: {', '.join(removed_conditions)}.")
    
    if added_conditions:
        summary_parts.append(f"Newly identified conditions: {', '.join(added_conditions)}.")
    
    if removed_findings:
        summary_parts.append(f"Previous findings no longer present: {', '.join(removed_findings)}.")
    
    if added_findings:
        summary_parts.append(f"New findings: {', '.join(added_findings)}.")
    
    if recovery_indicators:
        summary_parts.append(f"Positive recovery indicators: {', '.join(recovery_indicators)}.")
    
    if summary_parts:
        report["progress_summary"] = " ".join(summary_parts)
    else:
        report["progress_summary"] = "No significant changes in conditions or findings were detected."
    
    # Generate treatment recommendations based on recovery percentage
    recovery_pct = recovery_metrics["overall_recovery_percentage"]
    
    if recovery_pct < 25:
        report["treatment_recommendations"].append("Limited recovery observed. Consider reevaluating current treatment approach.")
    elif recovery_pct < 50:
        report["treatment_recommendations"].append("Early stages of recovery detected. Continue current treatment with close monitoring.")
    elif recovery_pct < 75:
        report["treatment_recommendations"].append("Moderate recovery progress. Continue current treatment regimen with periodic follow-ups.")
    else:
        report["treatment_recommendations"].append("Significant recovery observed. Consider transitioning to maintenance therapy or rehabilitation.")
    
    # Add specific recommendations based on bone healing
    bone_healing_pct = recovery_metrics["bone_healing_percentage"]
    if bone_healing_pct < 30:
        report["treatment_recommendations"].append("Limited bone healing observed. Maintain immobilization and consider nutritional supplements to support bone formation.")
    elif bone_healing_pct < 60:
        report["treatment_recommendations"].append("Moderate bone healing progress. Consider gradual weight-bearing exercises if appropriate for this stage.")
    else:
        report["treatment_recommendations"].append("Advanced bone healing observed. Consider physical therapy to restore full functionality.")
    
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