# 🩺 Enhanced Doctor Dashboard – AI-Driven Scan Report Generator with Cloud Integration

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20MongoDB%20%7C%20React-blue)
![Status](https://img.shields.io/badge/status-In_Progress-yellow)

> 🚀 Smart, secure, and scalable medical dashboard to generate AI-powered scan reports, integrated with cloud storage and QR sharing.



## 📚 Overview

The **Enhanced Doctor Dashboard** is a modern, full-stack health-tech platform that lets doctors:

- Upload patient scan data
- Simulate AI-generated diagnoses
- Generate & share PDF reports
- Store everything securely in the cloud (Cloudinary)
- Use QR codes for instant report access

---

## 🧩 Core Features

### 🧑‍⚕️ Patient Input Module
- Input fields: patient name, contact, and multiple doctor names.
- Instant form validation.
- React-based interface for fast updates.

### 📤 Scan Upload & AI Simulation
- Upload a scan (image/PDF).
- Generate a simulated diagnosis result.
- View results dynamically in a PDF format.

### 📄 PDF Generation & Cloud Storage
- Uses **PDFKit** to build structured, stylized PDFs.
- Uploads PDFs to **Cloudinary** via SDK.
- Removes local temp files post-upload.
- Stores Cloudinary URL in **MongoDB** using Mongoose.

### 🔁 Smart API Integration
- `/scan` POST API for report submission.
- Returns structured JSON with:
  - Diagnosis result
  - Report ID
  - PDF cloud link

### 📱 QR Code Sharing
- Generates a **QR code** per report.
- Scan redirects to public view/download link.

### 🗃️ Database (MongoDB)
- Stores:
  - Patient info
  - Doctor list
  - Cloud PDF URLs
  - Report meta details

---

## 🛠️ Tech Stack

| Layer      | Technologies |
|------------|--------------|
| **Frontend** | React.js, Axios, QR Code Generator, Tailwind CSS *(planned)* |
| **Backend**  | Node.js, Express, PDFKit, dotenv, Cloudinary SDK |
| **Database** | MongoDB (via Mongoose ODM) |
| **Cloud**    | Cloudinary |
| **Utils**    | fs, cors, body-parser |

---## ⚙️ Setup Instructions

### 🔧 Backend Setup

```bash
cd backend
npm install
touch .env
# Add MongoDB & Cloudinary credentials to the .env file
npm run dev

### 🔧 Fronte-end set UP
cd frontend
npm install
npm start



