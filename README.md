# MedVisor: AI-Driven Anomaly Detection and Radiology Report Generation

MedVisor is an advanced medical assistance application that uses artificial intelligence to analyze medical images, detect anomalies, and generate preliminary radiology reports. The platform features 3D visualization capabilities, longitudinal report comparison, and community support for healthcare professionals.

![MedVisor Logo](https://via.placeholder.com/800x200?text=MedVisor)

## 🌟 Key Features

- **Advanced Medical Image Analysis**: Process and analyze various medical imaging formats including X-rays, MRIs, CT scans
- **3D Visualization**: Transform 2D medical images into interactive 3D models using Three.js
- **Longitudinal Comparison**: Compare patient reports and images over time to track progression
- **Patient History Management**: Comprehensive record keeping for patient medical histories
- **Community Support**: Connect with healthcare professionals for second opinions and consultations

## 📋 System Requirements

- Python 3.8+
- Node.js 14.0+
- npm 6.0+
- Web browser with WebGL support

## 🚀 Installation and Setup

### Clone the Repository

```bash
git clone https://github.com/yourusername/medvisor.git
cd medvisor
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```bash
   flask run
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

### 3D Model Viewer

The 3D model viewer is available as a standalone HTML file if not integrated into the main dashboard:

1. Open `3dmodel.html` in your web browser:
   ```bash
   # From the project root
   open ImageTo3D.html
   ```

## 💻 Usage

1. **Upload Medical Images**:
   - Navigate to the upload section
   - Select or drag-and-drop medical images
   - Choose the image type (X-ray, MRI, CT scan, etc.)

2. **View Analysis**:
   - After uploading, the AI will analyze the image
   - View detected anomalies highlighted on the image
   - Review the preliminary report

3. **Use 3D Visualization**:
   - Toggle to 3D view to see a three-dimensional rendering
   - Rotate, zoom, and explore the 3D model
   - Use cross-sectional views for detailed examination

4. **Compare Reports**:
   - Select multiple reports from the patient's history
   - View side-by-side comparisons
   - Track changes over time with visual indicators

5. **Community Support**:
   - Share anonymized cases for consultation
   - Request second opinions from specialists
   - Participate in discussions about similar cases

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support, please open an issue on the GitHub repository or contact the development team at support@medvisor.example.com.
