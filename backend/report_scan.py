# report_scan.py
# Core functionality for medical scan analysis using Groq API

import os
import base64
import logging
from io import BytesIO
from typing import List, Optional, Dict, Any, Union
import numpy as np
from PIL import Image
import pydicom
import nibabel as nib
from groq import Groq
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'dcm', 'nii', 'nii.gz'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Pydantic models for structured output
class Finding(BaseModel):
    type: str
    description: str
    confidence: Optional[float] = None
    confidence_text: Optional[str] = None
    location: Optional[str] = None

class AnomalyDetection(BaseModel):
    anomaly_detected: bool
    analysis: str
    findings: List[Finding] = []
    error: Optional[str] = None

class ReportAnalysis(BaseModel):
    report_analysis: str
    findings: List[str] = []

class ScanAnalysisResult(BaseModel):
    scan_type: str
    anomaly_detection: AnomalyDetection
    report_analysis: Optional[ReportAnalysis] = None

class HealthStatus(BaseModel):
    status: str
    groq_client_status: str

# Initialize Groq client
try:
    groq_client = Groq(api_key="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")
    logger.info("Groq client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {str(e)}")
    groq_client = None

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.split('.')[-1].lower() in ALLOWED_EXTENSIONS

def get_image_data_url(image_path):
    """Convert image to data URL for Groq API"""
    img_format = image_path.split('.')[-1].lower()
    
    if img_format in ['dcm']:
        # Handle DICOM - convert to PNG
        dicom = pydicom.dcmread(image_path)
        img_array = dicom.pixel_array
        # Normalize pixel values
        if img_array.max() > 0:
            img_array = (img_array / img_array.max() * 255).astype(np.uint8)
        img = Image.fromarray(img_array)
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{img_str}"
    
    elif img_format in ['nii', 'gz']:
        # Handle NIfTI - convert to PNG
        nifti = nib.load(image_path)
        img_array = nifti.get_fdata()
        # Take a middle slice for 3D volumes
        if len(img_array.shape) == 3:
            middle_idx = img_array.shape[2] // 2
            img_array = img_array[:, :, middle_idx]
        # Normalize pixel values
        if img_array.max() > 0:
            img_array = (img_array / img_array.max() * 255).astype(np.uint8)
        img = Image.fromarray(img_array)
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{img_str}"
    
    else:
        # Handle standard image formats
        with open(image_path, "rb") as img_file:
            img_str = base64.b64encode(img_file.read()).decode('utf-8')
        return f"data:image/{img_format};base64,{img_str}"

def classify_scan_type_with_groq(image_path):
    """Classify scan type using Groq's vision model"""
    if groq_client is None:
        logger.error("Groq client not initialized")
        return "Unknown Scan Type"
    
    try:
        # Convert image to data URL
        image_data_url = get_image_data_url(image_path)
        
        # Prepare the prompt for scan type classification
        completion = groq_client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "What type of medical scan is this? Please respond with exactly one of the following options: CT Scan, MRI Scan, X-ray, Ultrasound, PET Scan, or Other (specify if possible). Only respond with the scan type."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data_url
                            }
                        }
                    ]
                }
            ],
            temperature=0.1,  # Low temperature for more deterministic responses
            # max_completion_tokens=50,  # Short response needed
            top_p=1,
            stream=False,
            stop=None,
        )
        
        scan_type = completion.choices[0].message.content.strip()
        logger.info(f"Scan classification result: {scan_type}")
        
        # Extract just the scan type if there's additional text
        common_types = ["CT Scan", "MRI Scan", "X-ray", "Ultrasound", "PET Scan"]
        for type_name in common_types:
            if type_name.lower() in scan_type.lower():
                return type_name
        
        # Try to extract from DICOM metadata if available
        if image_path.endswith('.dcm'):
            try:
                dicom = pydicom.dcmread(image_path)
                modality = getattr(dicom, 'Modality', '')
                if modality == 'CT':
                    return "CT Scan"
                elif modality == 'MR':
                    return "MRI Scan"
                elif modality == 'DX' or modality == 'CR':
                    return "X-ray"
                elif modality == 'US':
                    return "Ultrasound"
            except:
                pass
        
        # Return the original response if no match found
        return scan_type
        
    except Exception as e:
        logger.error(f"Error in Groq API call for scan classification: {str(e)}")
        return "Unknown Scan Type"

def detect_anomalies_with_groq(image_path):
    """Detect anomalies using Groq's Llama 3.2 Vision model"""
    if groq_client is None:
        logger.error("Groq client not initialized")
        return AnomalyDetection(
            anomaly_detected=False,
            analysis="Error: Groq client not initialized",
            error="Groq client not initialized"
        )
    
    try:
        # Convert image to data URL
        image_data_url = get_image_data_url(image_path)
        
        # Prepare the prompt
        completion = groq_client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this medical scan for anomalies. Follow this format exactly:
1. Start with either "ANOMALY: YES" or "ANOMALY: NO"
2. Provide a detailed medical explanation
3. If anomaly exists, list under FINDINGS: describing location and nature of each anomaly
4. If no anomaly, explain why the scan appears normal"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data_url
                            }
                        }
                    ]
                }
            ],
            temperature=0.5,  # Lower temperature for more deterministic/medical responses
            # max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        
        response_text = completion.choices[0].message.content
        logger.info(f"Groq anomaly detection response received: {response_text[:100]}...")
        
        # Parse response to determine if anomaly was detected
        anomaly_detected = "ANOMALY: YES" in response_text.upper()
        
        # Extract findings from the response
        findings = []
        if anomaly_detected:
            # Try to parse findings section
            if "FINDINGS:" in response_text:
                findings_text = response_text.split("FINDINGS:")[1].strip()
                # Simple parsing - each line might be a separate finding
                finding_lines = [line.strip() for line in findings_text.split('\n') if line.strip()]
                
                for i, line in enumerate(finding_lines):
                    findings.append(Finding(
                        type=f"Finding {i+1}",
                        description=line,
                        confidence_text="Based on visual analysis"
                    ))
            
            # If no structured findings were parsed, create a generic one
            if not findings:
                findings = [Finding(
                    type="potential anomaly",
                    description="See full analysis for details",
                    confidence_text="Based on visual analysis"
                )]
        
        return AnomalyDetection(
            anomaly_detected=anomaly_detected,
            analysis=response_text,
            findings=findings
        )
        
    except Exception as e:
        error_msg = f"Error in Groq API call: {str(e)}"
        logger.error(error_msg)
        return AnomalyDetection(
            anomaly_detected=False,
            analysis=f"Error occurred during analysis: {str(e)}",
            error=error_msg
        )

def analyze_report_with_groq(report_text):
    """Analyze medical report using Groq's LLM"""
    if groq_client is None:
        logger.error("Groq client not initialized")
        return ReportAnalysis(
            report_analysis="Error: Groq client not initialized",
            findings=[]
        )
    
    try:
        # Prepare the prompt for report analysis
        completion = groq_client.chat.completions.create(
            model="llama-3.2-90b",  # Text-only model is sufficient for report analysis
            messages=[
                {
                    "role": "user",
                    "content": f"""Analyze this medical report and extract key findings. 
The report is: {report_text}

Format your response as follows:
1. Start with "SUMMARY:" followed by a brief 1-2 sentence summary
2. Then "KEY FINDINGS:" followed by a bullet list of important medical observations
3. Do not include any other information."""
                }
            ],
            temperature=0.2,
            # max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )
        
        response_text = completion.choices[0].message.content
        logger.info(f"Report analysis received: {response_text[:100]}...")
        
        # Extract findings from the response
        findings = []
        if "KEY FINDINGS:" in response_text:
            findings_text = response_text.split("KEY FINDINGS:")[1].strip()
            # Split by bullet points or numbers
            for line in findings_text.split('\n'):
                line = line.strip()
                # Remove bullet points or numbers at start of line
                if line and (line[0] in ['-', '•', '*'] or (line[0].isdigit() and line[1:3] in ['. ', ') '])):
                    line = line[line.find(' ')+1:].strip()
                if line:
                    findings.append(line)
        
        # If no findings were parsed, set a generic message
        if not findings:
            findings = ["No specific findings extracted from report"]
        
        summary = "Report analysis completed"
        if "SUMMARY:" in response_text:
            summary_text = response_text.split("SUMMARY:")[1].strip()
            if "KEY FINDINGS:" in summary_text:
                summary = summary_text.split("KEY FINDINGS:")[0].strip()
            else:
                summary = summary_text
        
        return ReportAnalysis(
            report_analysis=summary,
            findings=findings
        )
        
    except Exception as e:
        error_msg = f"Error in Groq API call for report analysis: {str(e)}"
        logger.error(error_msg)
        return ReportAnalysis(
            report_analysis=f"Error analyzing report: {str(e)}",
            findings=[]
        )

def process_scan(scan_path, report_text=None):
    """Process a scan image and optional report, returning full analysis"""
    try:
        # Perform analysis
        scan_type = classify_scan_type_with_groq(scan_path)
        anomalies = detect_anomalies_with_groq(scan_path)
        
        # Build response using Pydantic model
        response = ScanAnalysisResult(
            scan_type=scan_type,
            anomaly_detection=anomalies
        )
        
        # Add report analysis if report is available
        if report_text:
            report_analysis = analyze_report_with_groq(report_text)
            response.report_analysis = report_analysis
        
        return response.dict(), None
    
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return None, f"Processing error: {str(e)}"

def check_health():
    """Check if all components are functioning correctly"""
    return HealthStatus(
        status='healthy', 
        groq_client_status='connected' if groq_client is not None else 'not configured'
    ).dict()