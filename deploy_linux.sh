#!/bin/bash

# Al-Manara AI Subtitle Studio - Linux Deployment Script
# استوديو المنارة - سكربت النشر للينكس

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Al-Manara Creative Suite - LINUX DEPLOY              ║"
echo "║              إعداد استوديو المنارة على السيرفر               ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# 1. Update System
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies
echo "Installing Python, Git, and FFmpeg..."
sudo apt install -y python3-pip python3-venv ffmpeg git screen

# 3. Create Virtual Environment
echo "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# 4. Install Requirements
echo "Installing Python libraries..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# 5. Create Storage Folders
echo "Creating upload and export directories..."
mkdir -p shared/uploads shared/exports

# 6. Download Recommended Model (Medium)
echo "Downloading AI Model (Medium)..."
python3 download_model.py medium

echo "══════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE! - تم الإعداد بنجاح!"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "To start the backend server, run:"
echo "source venv/bin/activate"
echo "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "Note: Make sure to open port 8000 in your Oracle Cloud Firewall."
