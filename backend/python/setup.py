#!/usr/bin/env python3
"""
Setup script for Surya OCR dependencies
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    requirements_path = Path(__file__).parent / 'requirements.txt'
    
    try:
        print("Installing Surya OCR and dependencies...")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', str(requirements_path)
        ])
        print("Dependencies installed successfully!")
        
        # Download Surya models
        print("Downloading Surya OCR models...")
        import surya
        from surya.model.detection.segformer import load_model as load_det_model
        from surya.model.recognition.model import load_model as load_rec_model
        
        # This will download models to cache
        load_det_model()
        load_rec_model()
        
        print("Models downloaded successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to install dependencies: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    install_requirements()
