# Use Python 3.9 Slim as base
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY backend/app ./app
COPY download_model.py .

# Create storage directories
RUN mkdir -p shared/uploads shared/exports

# Pre-download the base model (optional)
RUN python3 download_model.py base

# Hugging Face uses port 7860
EXPOSE 7860

# Start the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
