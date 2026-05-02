from huggingface_hub import HfApi
import os

api = HfApi()
token = "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"
repo_id = "mohamedtaha2600/almanara-ai-engine"
folder_path = r"d:\PROGRAMS\Program HTML 2\محرك توليد  SUPtitle  وغيرها من  الاداوت الاخري\hf_deploy"

print(f"🚀 Re-pushing clean update to {repo_id}...")
try:
    api.upload_folder(
        folder_path=folder_path,
        repo_id=repo_id,
        repo_type="space",
        token=token
    )
    print("✅ Successfully updated Hugging Face Space with clean code!")
except Exception as e:
    print(f"❌ Upload failed: {e}")
