
import os
from huggingface_hub import HfApi

# Token is loaded from environment variable for security
# Run: set HF_TOKEN=hf_xxx   (Windows) or export HF_TOKEN=hf_xxx (Linux)
token = os.environ.get("HF_TOKEN")
if not token:
    raise ValueError("❌ HF_TOKEN environment variable not set! Please set it before running this script.")
repo_id = "mohamedtaha2600/almanara-ai-engine"

api = HfApi()


print(f"🚀 Starting Direct Upload to Hugging Face: {repo_id}")

try:
    # 0. Upload README.md (Metadata)
    print("📤 Uploading README.md (Metadata)...")
    api.upload_file(
        path_or_fileobj="README_HF.md",
        path_in_repo="README.md",
        repo_id=repo_id,
        repo_type="space",
        token=token
    )

    # 1. Upload Dockerfile
    print("📤 Uploading Dockerfile...")
    api.upload_file(
        path_or_fileobj="Dockerfile",
        path_in_repo="Dockerfile",
        repo_id=repo_id,
        repo_type="space",
        token=token
    )

    # 2. Upload requirements.txt
    print("📤 Uploading requirements.txt...")
    api.upload_file(
        path_or_fileobj="backend/requirements.txt",
        path_in_repo="requirements.txt",
        repo_id=repo_id,
        repo_type="space",
        token=token
    )

    # 3. Upload download_model.py
    print("📤 Uploading download_model.py...")
    api.upload_file(
        path_or_fileobj="download_model.py",
        path_in_repo="download_model.py",
        repo_id=repo_id,
        repo_type="space",
        token=token
    )

    # 4. Upload app folder
    print("📤 Uploading app folder...")
    api.upload_folder(
        folder_path="backend/app",
        path_in_repo="app",
        repo_id=repo_id,
        repo_type="space",
        token=token
    )

    print("✅ SUCCESS! All files uploaded to Hugging Face.")
    print("🌍 Space should start building now.")

except Exception as e:
    print(f"❌ ERROR: {e}")
