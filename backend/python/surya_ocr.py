#!/usr/bin/env python3
"""
Surya OCR Service for Expense Management System
Processes receipt images and extracts structured data
"""

import sys
import json
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
import traceback
from datetime import datetime
import re

# Try different import patterns for Surya OCR
SURYA_AVAILABLE = False
run_ocr = None

try:
    # Try the standard import
    from surya.ocr import run_ocr
    SURYA_AVAILABLE = True
    print("Using surya.ocr import", file=sys.stderr)
except ImportError:
    try:
        # Try alternative import structure
        import surya
        if hasattr(surya, 'ocr'):
            run_ocr = surya.ocr
            SURYA_AVAILABLE = True
            print("Using surya.ocr attribute", file=sys.stderr)
        elif hasattr(surya, 'run_ocr'):
            run_ocr = surya.run_ocr
            SURYA_AVAILABLE = True
            print("Using surya.run_ocr attribute", file=sys.stderr)
    except ImportError:
        pass

if not SURYA_AVAILABLE:
    try:
        # Try command line approach as fallback
        import subprocess
        SURYA_CLI_AVAILABLE = True
        print("Using Surya CLI fallback", file=sys.stderr)
    except ImportError:
        SURYA_CLI_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SuryaOCRProcessor:
    """Surya OCR processor for receipt text extraction and parsing"""
    
    def __init__(self, languages: List[str] = None):
        """Initialize Surya OCR processor"""
        self.languages = languages or ['en']
        
        if not (SURYA_AVAILABLE or SURYA_CLI_AVAILABLE):
            raise ImportError("Surya OCR is not available")
        
        if not PIL_AVAILABLE:
            raise ImportError("PIL/Pillow is required")
    
    def extract_text_cli(self, image_path: str) -> Dict[str, Any]:
        """Extract text using Surya CLI command"""
        try:
            import subprocess
            import tempfile
            import os
            
            # Create temporary output directory
            with tempfile.TemporaryDirectory() as temp_dir:
                output_path = os.path.join(temp_dir, "output.json")
                
                # Run Surya OCR command
                cmd = [
                    "python", "-m", "surya.main",
                    "ocr",
                    image_path,
                    "--output_dir", temp_dir,
                    "--langs"] + self.languages
                
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                    
                    if result.returncode == 0:
                        # Try to read output file
                        if os.path.exists(output_path):
                            with open(output_path, 'r') as f:
                                data = json.load(f)
                                return self._parse_cli_output(data)
                        else:
                            # Parse stdout
                            return self._parse_stdout(result.stdout)
                    else:
                        return {
                            "success": False,
                            "error": f"Surya CLI failed: {result.stderr}"
                        }
                        
                except subprocess.TimeoutExpired:
                    return {
                        "success": False,
                        "error": "OCR processing timed out"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"CLI extraction failed: {str(e)}"
            }
    
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text from image using available Surya method"""
        try:
            # Validate image path
            if not Path(image_path).exists():
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Load image for metadata
            image = Image.open(image_path)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            logger.info(f"Processing image: {image_path} (size: {image.size})")
            
            # Try direct OCR first
            if SURYA_AVAILABLE and run_ocr:
                try:
                    predictions = run_ocr([image], [self.languages])
                    return self._parse_direct_output(predictions, image.size)
                except Exception as e:
                    logger.warning(f"Direct OCR failed: {e}, trying CLI fallback")
            
            # Fallback to CLI approach
            if SURYA_CLI_AVAILABLE:
                return self.extract_text_cli(image_path)
            
            return {
                "success": False,
                "error": "No working Surya OCR method available"
            }
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def _parse_direct_output(self, predictions, image_size):
        """Parse direct OCR output"""
        if not predictions:
            return {"success": False, "error": "No text detected"}
        
        prediction = predictions[0]
        extracted_text = ""
        text_blocks = []
        confidence_scores = []
        
        # Handle different prediction structures
        if hasattr(prediction, 'text_lines'):
            for text_line in prediction.text_lines:
                line_text = text_line.text.strip()
                if line_text:
                    extracted_text += line_text + "\n"
                    confidence = getattr(text_line, 'confidence', 0.9)
                    text_blocks.append({
                        "text": line_text,
                        "confidence": confidence
                    })
                    confidence_scores.append(confidence)
        else:
            # Fallback parsing
            text = str(prediction).strip()
            if text:
                extracted_text = text
                text_blocks = [{"text": text, "confidence": 0.9}]
                confidence_scores = [0.9]
        
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.9
        
        return {
            "success": True,
            "extracted_text": extracted_text.strip(),
            "confidence": avg_confidence,
            "text_blocks": text_blocks,
            "language": self.languages[0],
            "image_size": image_size,
            "processing_time": datetime.now().isoformat()
        }
    
    def _parse_cli_output(self, data):
        """Parse CLI JSON output"""
        try:
            extracted_text = ""
            text_blocks = []
            
            if isinstance(data, dict) and 'text' in data:
                extracted_text = data['text']
                text_blocks = [{"text": extracted_text, "confidence": 0.9}]
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, str):
                        extracted_text += item + "\n"
                        text_blocks.append({"text": item, "confidence": 0.9})
            
            return {
                "success": True,
                "extracted_text": extracted_text.strip(),
                "confidence": 0.9,
                "text_blocks": text_blocks,
                "language": self.languages[0],
                "processing_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse CLI output: {str(e)}"
            }
    
    def _parse_stdout(self, stdout):
        """Parse stdout text output"""
        lines = [line.strip() for line in stdout.split('\n') if line.strip()]
        
        if not lines:
            return {"success": False, "error": "No text extracted"}
        
        extracted_text = '\n'.join(lines)
        text_blocks = [{"text": line, "confidence": 0.9} for line in lines]
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "confidence": 0.9,
            "text_blocks": text_blocks,
            "language": self.languages[0],
            "processing_time": datetime.now().isoformat()
        }
    
    def parse_receipt_data(self, extracted_text: str) -> Dict[str, Any]:
        """Parse extracted text to identify receipt components"""
        try:
            receipt_data = {
                "merchant_name": None,
                "total_amount": None,
                "date": None,
                "items": [],
                "tax_amount": None,
                "subtotal": None,
                "payment_method": None,
                "receipt_number": None,
                "address": None,
                "phone": None
            }
            
            lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
            
            # Extract merchant name (usually first meaningful line)
            receipt_data["merchant_name"] = self._extract_merchant_name(lines)
            
            # Extract amounts
            amounts = self._extract_amounts(extracted_text)
            receipt_data.update(amounts)
            
            # Extract date
            receipt_data["date"] = self._extract_date(extracted_text)
            
            # Extract items
            receipt_data["items"] = self._extract_items(lines)
            
            # Extract other data
            receipt_data["address"] = self._extract_address(extracted_text)
            receipt_data["phone"] = self._extract_phone(extracted_text)
            receipt_data["receipt_number"] = self._extract_receipt_number(extracted_text)
            receipt_data["payment_method"] = self._extract_payment_method(extracted_text)
            
            return receipt_data
            
        except Exception as e:
            logger.error(f"Receipt parsing failed: {str(e)}")
            return {"error": str(e)}
    
    def _extract_merchant_name(self, lines: List[str]) -> Optional[str]:
        """Extract merchant name from receipt lines"""
        for line in lines[:5]:
            if (len(line) > 3 and len(line) < 50 and 
                not re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', line) and
                not re.search(r'\d+\s+\w+\s+(st|street|ave|avenue|rd|road)', line.lower()) and
                not line.lower() in ['receipt', 'invoice', 'bill', 'order', 'ticket']):
                return line
        return None
    
    def _extract_amounts(self, text: str) -> Dict[str, Optional[float]]:
        """Extract amounts from text"""
        amounts = {"total_amount": None, "subtotal": None, "tax_amount": None}
        
        # Find all dollar amounts
        dollar_amounts = re.findall(r'\$?(\d+\.\d{2})', text)
        if dollar_amounts:
            try:
                amounts["total_amount"] = max([float(amt) for amt in dollar_amounts])
            except ValueError:
                pass
        
        # Look for specific patterns
        total_match = re.search(r'(?:total|amount)[\s:$]*(\d+\.?\d*)', text.lower())
        if total_match:
            try:
                amounts["total_amount"] = float(total_match.group(1))
            except ValueError:
                pass
        
        return amounts
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from text"""
        date_patterns = [
            r'(\d{1,2}\/\d{1,2}\/\d{2,4})',
            r'(\d{1,2}-\d{1,2}-\d{2,4})',
            r'(\d{4}-\d{2}-\d{2})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return None
    
    def _extract_items(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Extract line items"""
        items = []
        for line in lines:
            item_match = re.search(r'^(.+?)\s+\$?(\d+\.?\d*)$', line)
            if item_match:
                item_name = item_match.group(1).strip()
                try:
                    item_price = float(item_match.group(2))
                    if (len(item_name) > 2 and 
                        not any(word in item_name.lower() for word in ['total', 'tax', 'change'])):
                        items.append({"name": item_name, "price": item_price})
                except ValueError:
                    continue
        return items
    
    def _extract_address(self, text: str) -> Optional[str]:
        """Extract address"""
        match = re.search(r'\d+\s+\w+\s+(?:st|street|ave|avenue|rd|road)', text.lower())
        return match.group(0) if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number"""
        match = re.search(r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})', text)
        return match.group(1) if match else None
    
    def _extract_receipt_number(self, text: str) -> Optional[str]:
        """Extract receipt number"""
        match = re.search(r'(?:receipt|order)[\s#:]*([a-zA-Z0-9]+)', text.lower())
        return match.group(1) if match else None
    
    def _extract_payment_method(self, text: str) -> Optional[str]:
        """Extract payment method"""
        text_lower = text.lower()
        if 'cash' in text_lower:
            return 'cash'
        elif any(word in text_lower for word in ['credit', 'visa', 'mastercard']):
            return 'credit'
        elif 'debit' in text_lower:
            return 'debit'
        return None

def categorize_expense(merchant_name: str, items: List[Dict]) -> str:
    """Categorize expense based on merchant and items"""
    merchant_lower = (merchant_name or '').lower()
    items_text = ' '.join([item.get('name', '') for item in items]).lower()
    
    categories = {
        'meals': ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'pizza', 'burger', 'starbucks'],
        'transportation': ['uber', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train'],
        'accommodation': ['hotel', 'motel', 'inn', 'resort', 'marriott', 'hilton'],
        'office_supplies': ['office', 'supplies', 'paper', 'pen', 'staples'],
        'entertainment': ['cinema', 'movie', 'theater', 'bar', 'club']
    }
    
    for category, keywords in categories.items():
        if any(keyword in merchant_lower or keyword in items_text for keyword in keywords):
            return category
    
    return 'other'

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Surya OCR Receipt Processor')
    parser.add_argument('image_path', help='Path to the receipt image')
    parser.add_argument('--languages', nargs='+', default=['en'], help='Languages to detect')
    
    args = parser.parse_args()
    
    try:
        processor = SuryaOCRProcessor(languages=args.languages)
        ocr_result = processor.extract_text(args.image_path)
        
        if not ocr_result["success"]:
            print(json.dumps(ocr_result))
            sys.exit(1)
        
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
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
