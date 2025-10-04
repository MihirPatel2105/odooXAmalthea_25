#!/usr/bin/env python3
"""
Setup script for Tesseract OCR dependencies
"""

import subprocess
import sys
import os
import platform
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    requirements_path = Path(__file__).parent / 'requirements.txt'
    
    try:
        print("Installing Tesseract OCR and dependencies...")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', str(requirements_path)
        ])
        print("Python dependencies installed successfully!")
        
        # Check if Tesseract is installed on the system
        check_tesseract_installation()
        
    except subprocess.CalledProcessError as e:
        print(f"Error installing requirements: {e}")
        return False
    return True

def check_tesseract_installation():
    """Check if Tesseract OCR is installed on the system"""
    try:
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✓ Tesseract OCR is already installed on the system")
            print(f"Version: {result.stdout.split()[1] if len(result.stdout.split()) > 1 else 'Unknown'}")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    print("⚠ Tesseract OCR is not installed on the system")
    print_installation_instructions()
    return False

def print_installation_instructions():
    """Print platform-specific installation instructions for Tesseract"""
    system = platform.system().lower()
    
    print("\nTo install Tesseract OCR:")
    if system == "darwin":  # macOS
        print("  brew install tesseract")
    elif system == "linux":
        print("  Ubuntu/Debian: sudo apt-get install tesseract-ocr")
        print("  CentOS/RHEL: sudo yum install tesseract")
    elif system == "windows":
        print("  Download from: https://github.com/UB-Mannheim/tesseract/wiki")
        print("  Or use chocolatey: choco install tesseract")
    else:
        print("  Please install Tesseract OCR for your operating system")
    
    print("\nFor additional language support:")
    if system == "darwin":
        print("  brew install tesseract-lang")
    elif system == "linux":
        print("  sudo apt-get install tesseract-ocr-[lang]")
        print("  Example: sudo apt-get install tesseract-ocr-fra tesseract-ocr-deu")

if __name__ == "__main__":
    print("Setting up Tesseract OCR environment...")
    success = install_requirements()
    
    if success:
        print("\n✓ Setup completed successfully!")
        print("Run 'python tesseract_ocr.py test_image.jpg' to test OCR functionality")
    else:
        print("\n✗ Setup failed!")
        sys.exit(1)
    install_requirements()
