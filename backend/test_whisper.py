import sys
import os
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Setup path to import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app.services.whisper_service import WhisperService

def format_timestamp(seconds: float):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

async def main():
    print("---------------------------------------------------------")
    print("   Whisper Standalone Tester - (Test Models & GPU)")
    print("---------------------------------------------------------")

    target_file = ""
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    else:
        # Ask user for input if not dragged
        target_file = input(">> Enter full path to audio/video file: ").strip().strip('"')

    if not os.path.exists(target_file):
        print(f"❌ Error: File not found: {target_file}")
        input("Press Enter to exit...")
        return

    print(f"\n📂 Target: {target_file}")
    
    # Model Selection
    print("\nSelect Model Size:")
    print("1. Tiny (Fastest)")
    print("2. Base (Fast)")
    print("3. Small (Balanced)")
    print("4. Medium (Good)")
    print("5. Large-v3 (Best)")
    
    choice = input(">> Choose (default 2): ").strip()
    model_map = {"1": "tiny", "2": "base", "3": "small", "4": "medium", "5": "large-v3"}
    model_size = model_map.get(choice, "base")

    # GPU Mode
    print("\nUse GPU?")
    gpu_choice = input(">> (y/n, default y): ").lower().strip()
    use_gpu = gpu_choice != "n"

    print(f"\n🚀 Initializing WhisperService (Model: {model_size}, GPU: {use_gpu})...")
    service = WhisperService()

    def progress_handler(pct, msg):
        print(f"   [{pct}%] {msg}")

    try:
        print("⏳ Starting Transcription...")
        result = await service.transcribe(
            file_path=target_file,
            model_size=model_size,
            use_gpu=use_gpu,
            progress_callback=progress_handler
        )
        
        # Generate SRT
        print("\n📝 Generating SRT...")
        srt_lines = []
        for i, seg in enumerate(result["segments"]):
            start = format_timestamp(seg["start"])
            end = format_timestamp(seg["end"])
            text = seg["text"]
            srt_lines.append(f"{i+1}\n{start} --> {end}\n{text}\n")
        
        srt_content = "\n".join(srt_lines)
        srt_path = os.path.splitext(target_file)[0] + ".srt"
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        print(f"✅ DONE! Saved to: {srt_path}")

    except Exception as e:
        print(f"\n❌ FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

    print("\n---------------------------------------------------------")
    input("Press Enter to close...")

if __name__ == "__main__":
    asyncio.run(main())
