const path = require('path');

const tesseractConfig = {
  pythonPath: process.env.PYTHON_PATH || 'python3',
  scriptPath: process.env.TESSERACT_OCR_SCRIPT_PATH || path.join(__dirname, '../python/tesseract_ocr.py'),
  confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.7,
  timeout: parseInt(process.env.OCR_TIMEOUT) || 30000,
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_OCR) || 3,
  queueTimeout: parseInt(process.env.OCR_QUEUE_TIMEOUT) || 60000,
  
  settings: {
    languages: ['eng'], // Tesseract language codes (eng, fra, deu, etc.)
    psm: 6, // Page segmentation mode (6 = uniform block of text)
    oem: 3, // OCR Engine Mode (3 = default, based on what is available)
    dpi: 300, // DPI for image processing
    preprocess: true, // Enable image preprocessing
    confidence_threshold: 30 // Minimum confidence for text blocks
  }
};

module.exports = tesseractConfig;
