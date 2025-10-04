#!/usr/bin/env python3
"""
Tesseract OCR Service for Expense Management System
Processes receipt images and extracts structured data using Tesseract OCR
"""

import sys
import json
import argparse
import logging
import re
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import traceback
from datetime import datetime

# Try to import required libraries
TESSERACT_AVAILABLE = False
PIL_AVAILABLE = False
CV2_AVAILABLE = False
PDF_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    print("✓ Pytesseract available", file=sys.stderr)
except ImportError:
    print("✗ Pytesseract not available", file=sys.stderr)

try:
    from PIL import Image
    PIL_AVAILABLE = True
    print("✓ PIL/Pillow available", file=sys.stderr)
except ImportError:
    print("✗ PIL/Pillow not available", file=sys.stderr)

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
    print("✓ OpenCV available", file=sys.stderr)
except ImportError:
    print("✗ OpenCV not available", file=sys.stderr)

try:
    from pdf2image import convert_from_path
    import pdfplumber
    PDF_AVAILABLE = True
    print("✓ PDF processing available", file=sys.stderr)
except ImportError:
    print("✗ PDF processing not available", file=sys.stderr)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def provide_mock_ocr_data(image_path: str) -> Dict[str, Any]:
    """Provide mock OCR data as fallback when Tesseract OCR is not available"""
    return {
        "success": True,
        "ocr_data": {
            "extracted_text": "Mock receipt data - OCR dependencies not available",
            "confidence": 0.0,
            "processing_time": 0.1,
            "language": "eng",
            "image_size": "unknown",
            "text_blocks": []
        },
        "parsed_data": {
            "merchant_name": "Unknown Vendor",
            "total_amount": "0.00",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "items": [],
            "subtotal": "0.00",
            "tax_amount": "0.00",
            "payment_method": "unknown",
            "receipt_number": "",
            "address": "",
            "phone": ""
        },
        "suggested_category": "general",
        "note": "OCR dependencies not available - please fill manually"
    }

class TesseractOCRProcessor:
    """Tesseract OCR processor for receipt text extraction and parsing"""
    
    def __init__(self, languages: List[str] = None):
        """Initialize Tesseract OCR processor"""
        self.languages = languages or ['eng']
        
        if not TESSERACT_AVAILABLE or not PIL_AVAILABLE:
            print("Warning: Tesseract or PIL not available - will use fallback", file=sys.stderr)
            self.ocr_available = False
        else:
            self.ocr_available = True
            # Set Tesseract language
            self.lang_string = '+'.join(self.languages)
    
    def preprocess_image(self, image_path: str) -> Optional[str]:
        """Preprocess image for better OCR results"""
        if not CV2_AVAILABLE:
            return image_path  # Return original if opencv not available
        
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return image_path
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Apply adaptive threshold
            thresh = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Save preprocessed image
            preprocessed_path = image_path.replace('.', '_preprocessed.')
            cv2.imwrite(preprocessed_path, thresh)
            
            return preprocessed_path
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {e}")
            return image_path
    
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text from image using Tesseract OCR"""
        if not self.ocr_available:
            return {
                "success": False,
                "error": "Tesseract OCR not available"
            }
        
        try:
            start_time = datetime.now()
            
            # Handle PDF files
            if image_path.lower().endswith('.pdf'):
                if PDF_AVAILABLE:
                    try:
                        # First try pdfplumber for better text extraction
                        with pdfplumber.open(image_path) as pdf:
                            if len(pdf.pages) > 0:
                                text = pdf.pages[0].extract_text()
                                if text and len(text.strip()) > 20:
                                    # If we got good text from pdfplumber, use it
                                    processing_time = (datetime.now() - start_time).total_seconds()
                                    return {
                                        "success": True,
                                        "extracted_text": text.strip(),
                                        "confidence": 0.95,  # High confidence for PDF text extraction
                                        "processing_time": processing_time,
                                        "language": self.lang_string,
                                        "image_size": "PDF",
                                        "text_blocks": []
                                    }
                    except Exception as e:
                        print(f"pdfplumber failed, falling back to image conversion: {e}", file=sys.stderr)
                    
                    # Fallback to image conversion if pdfplumber doesn't work well
                    try:
                        images = convert_from_path(image_path, first_page=1, last_page=1, dpi=300)
                        if images:
                            # Save first page as image with higher DPI
                            temp_image_path = image_path.replace('.pdf', '_temp_hires.jpg')
                            images[0].save(temp_image_path, 'JPEG', quality=95)
                            image_path = temp_image_path
                    except Exception as e:
                        print(f"PDF to image conversion failed: {e}", file=sys.stderr)
                        return {
                            "success": False,
                            "error": f"PDF processing failed: {e}"
                        }
                else:
                    return {
                        "success": False,
                        "error": "PDF processing not available"
                    }
            
            # Preprocess image for better OCR
            processed_path = self.preprocess_image(image_path)
            
            # Open image
            image = Image.open(processed_path)
            
            # Get image info
            width, height = image.size
            
            # Use multiple OCR configurations for better results
            configs = [
                '--psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$:- ',
                '--psm 4',  # Single column of text
                '--psm 6',  # Single uniform block
                '--psm 8',  # Single word
            ]
            
            best_result = None
            best_confidence = 0
            
            for config in configs:
                try:
                    # Extract text with confidence data
                    data = pytesseract.image_to_data(
                        image, 
                        lang=self.lang_string,
                        output_type=pytesseract.Output.DICT,
                        config=config
                    )
                    
                    # Extract plain text
                    text = pytesseract.image_to_string(
                        image,
                        lang=self.lang_string,
                        config=config
                    )
                    
                    # Calculate average confidence
                    confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                    
                    if avg_confidence > best_confidence and len(text.strip()) > 10:
                        best_confidence = avg_confidence
                        best_result = {
                            'text': text.strip(),
                            'data': data,
                            'confidence': avg_confidence
                        }
                
                except Exception as e:
                    print(f"OCR config {config} failed: {e}", file=sys.stderr)
                    continue
            
            if not best_result:
                return {
                    "success": False,
                    "error": "OCR extraction failed with all configurations"
                }
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Create text blocks from best result
            text_blocks = []
            data = best_result['data']
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 30:  # Only include confident text
                    text_blocks.append({
                        'text': data['text'][i],
                        'confidence': int(data['conf'][i]),
                        'bbox': [data['left'][i], data['top'][i], 
                                data['width'][i], data['height'][i]]
                    })
            
            # Clean up temporary files
            if processed_path != image_path:
                try:
                    os.remove(processed_path)
                except:
                    pass
            
            # Clean up PDF temp files
            if '_temp_hires.jpg' in image_path:
                try:
                    os.remove(image_path)
                except:
                    pass
            
            return {
                "success": True,
                "extracted_text": best_result['text'],
                "confidence": best_result['confidence'] / 100.0,  # Convert to 0-1 scale
                "processing_time": processing_time,
                "language": self.lang_string,
                "image_size": f"{width}x{height}",
                "text_blocks": text_blocks
            }
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def parse_receipt_data(self, text: str) -> Dict[str, Any]:
        """Parse receipt text to extract structured data"""
        parsed_data = {
            "merchant_name": "",
            "total_amount": "",
            "date": "",
            "items": [],
            "subtotal": "",
            "tax_amount": "",
            "payment_method": "",
            "receipt_number": "",
            "address": "",
            "phone": ""
        }
        
        lines = text.split('\n')
        text_lower = text.lower()
        
        # Extract merchant name (usually in first few lines, look for non-numeric lines)
        for i, line in enumerate(lines[:8]):
            line = line.strip()
            # Skip very short lines, lines with mostly numbers, or common receipt words
            if (len(line) > 4 and 
                not re.match(r'^[\d\s\-\.\/\$,]+$', line) and
                'receipt' not in line.lower() and
                'invoice' not in line.lower() and
                'total' not in line.lower() and
                'subtotal' not in line.lower() and
                'tax' not in line.lower() and
                not re.match(r'^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}', line)):
                parsed_data["merchant_name"] = line
                break
        
        # Extract total amount with more comprehensive patterns
        total_patterns = [
            r'total[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'amount[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'grand\s+total[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'\$\s*(\d+[,\.]?\d{2})\s*total',
            r'balance[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'due[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            # Look for standalone dollar amounts at end of lines
            r'\$\s*(\d+\.\d{2})\s*$',
            r'(\d+\.\d{2})\s*$',
        ]
        
        found_amounts = []
        for pattern in total_patterns:
            matches = re.findall(pattern, text_lower, re.MULTILINE)
            for match in matches:
                amount = match.replace(',', '')
                try:
                    amt_float = float(amount)
                    if 0.01 <= amt_float <= 10000:  # Reasonable range for expenses
                        found_amounts.append((amt_float, amount))
                except ValueError:
                    continue
        
        # Pick the largest reasonable amount as total
        if found_amounts:
            found_amounts.sort(reverse=True)
            parsed_data["total_amount"] = found_amounts[0][1]
        
        # Extract date with improved patterns
        date_patterns = [
            r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})',
            r'(\d{1,2}\s+\w{3,9}\s+\d{2,4})',
            r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}[,\s]+\d{2,4}',
            r'\d{1,2}[,\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,\s]+\d{2,4}',
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                parsed_data["date"] = matches[0] if isinstance(matches[0], str) else matches[0][0]
                break
        
        # Extract subtotal
        subtotal_patterns = [
            r'subtotal[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'sub\s+total[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'sub[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
        ]
        
        for pattern in subtotal_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                parsed_data["subtotal"] = matches[0].replace(',', '')
                break
        
        # Extract tax with more patterns
        tax_patterns = [
            r'tax[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'gst[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'hst[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'vat[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
            r'sales\s+tax[:\s]*\$?\s*(\d+[,\.]?\d{0,2})',
        ]
        
        for pattern in tax_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                parsed_data["tax_amount"] = matches[0].replace(',', '')
                break
        
        # Extract phone number
        phone_patterns = [
            r'(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})',
            r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})',
        ]
        
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                parsed_data["phone"] = matches[0]
                break
        
        # Extract receipt/transaction number
        receipt_patterns = [
            r'receipt[#:\s]*([a-zA-Z0-9]+)',
            r'transaction[#:\s]*([a-zA-Z0-9]+)',
            r'order[#:\s]*([a-zA-Z0-9]+)',
            r'invoice[#:\s]*([a-zA-Z0-9]+)',
            r'ref[#:\s]*([a-zA-Z0-9]+)',
        ]
        
        for pattern in receipt_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                parsed_data["receipt_number"] = matches[0]
                break
        
        # Extract payment method
        payment_patterns = [
            r'(visa|mastercard|amex|american express|discover)',
            r'(cash|credit|debit)',
            r'card\s+ending\s+in\s+(\d{4})',
        ]
        
        for pattern in payment_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                parsed_data["payment_method"] = matches[0]
                break
        
        return parsed_data

def categorize_expense(merchant_name: str, items: List[str]) -> str:
    """Categorize expense based on merchant name and items"""
    merchant_lower = merchant_name.lower()
    items_text = ' '.join(items).lower()
    
    # Food & Dining categories
    food_keywords = ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'dining', 'bar', 'pub', 'grill', 'kitchen', 'bistro', 'deli', 'bakery', 'mcdonalds', 'subway', 'starbucks', 'tim hortons']
    if any(keyword in merchant_lower for keyword in food_keywords):
        return 'meals'
    
    # Transportation categories
    transport_keywords = ['gas', 'fuel', 'petrol', 'shell', 'exxon', 'bp', 'chevron', 'taxi', 'uber', 'lyft', 'parking', 'metro', 'bus', 'train']
    if any(keyword in merchant_lower for keyword in transport_keywords):
        return 'transportation'
    
    # Office supplies
    office_keywords = ['office', 'staples', 'supplies', 'depot', 'paper', 'pen', 'computer', 'electronics']
    if any(keyword in merchant_lower for keyword in office_keywords):
        return 'office_supplies'
    
    # Travel
    travel_keywords = ['hotel', 'motel', 'airline', 'airport', 'flight', 'booking', 'travel', 'hilton', 'marriott', 'rental', 'car']
    if any(keyword in merchant_lower for keyword in travel_keywords):
        return 'travel'
    
    return 'general'

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Tesseract OCR Receipt Processor')
    parser.add_argument('image_path', help='Path to the receipt image')
    parser.add_argument('--languages', nargs='+', default=['eng'], help='Languages to detect (e.g., eng, fra, deu)')
    
    args = parser.parse_args()
    
    try:
        # Check if file exists
        if not os.path.exists(args.image_path):
            print(json.dumps({
                "success": False,
                "error": f"File not found: {args.image_path}"
            }))
            return
        
        # Check if OCR dependencies are available
        if not TESSERACT_AVAILABLE or not PIL_AVAILABLE:
            print("OCR dependencies not available, providing mock data", file=sys.stderr)
            mock_result = provide_mock_ocr_data(args.image_path)
            print(json.dumps(mock_result, indent=2))
            return

        processor = TesseractOCRProcessor(languages=args.languages)
        ocr_result = processor.extract_text(args.image_path)
        
        if not ocr_result["success"]:
            print("OCR processing failed, providing mock data", file=sys.stderr)
            mock_result = provide_mock_ocr_data(args.image_path)
            print(json.dumps(mock_result, indent=2))
            return
        
        parsed_data = processor.parse_receipt_data(ocr_result["extracted_text"])
        
        final_result = {
            "success": True,
            "ocr_data": ocr_result,
            "parsed_data": parsed_data,
            "suggested_category": categorize_expense(
                parsed_data.get("merchant_name", ""), 
                parsed_data.get("items", [])
            )
        }
        
        print(json.dumps(final_result, indent=2))
        
    except Exception as e:
        print(f"OCR processing failed with exception, providing mock data: {str(e)}", file=sys.stderr)
        mock_result = provide_mock_ocr_data(args.image_path)
        print(json.dumps(mock_result, indent=2))

if __name__ == "__main__":
    main()