import os
import sys
import ctypes
from pathlib import Path

def check_dll():
    print("--- GPU Debug Start ---")
    print(f"Python: {sys.executable}")
    print(f"CWD: {os.getcwd()}")
    
    # 1. Find the DLL file manually
    base_dir = Path(__file__).parent
    venv_site = base_dir / "venv/Lib/site-packages"
    
    print(f"Searching in: {venv_site}")
    
    cublas_dll = list(venv_site.glob("**/cublas64_12.dll"))
    
    if not cublas_dll:
        print("❌ cublas64_12.dll NOT FOUND on disk search!")
    else:
        dll_path = str(cublas_dll[0])
        print(f"✅ Found on disk: {dll_path}")
        
        # 2. Add directory to PATH manually for this test
        dll_dir = os.path.dirname(dll_path)
        os.environ['PATH'] = dll_dir + os.pathsep + os.environ['PATH']
        if hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(dll_dir)
            
        # 3. Try to load it
        try:
            ctypes.CDLL(dll_path)
            print("✅ ctypes.CDLL load success!")
        except Exception as e:
            print(f"❌ ctypes.CDLL load FAILED: {e}")
            
            # Check dependencies?
            # On Windows, sometimes Visual C++ Redistributable is missing
            
    print("--- GPU Debug End ---")

if __name__ == "__main__":
    check_dll()
