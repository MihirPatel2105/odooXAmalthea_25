const path = require('path');

const suryaConfig = {
  pythonPath: process.env.PYTHON_PATH || 'python3',
  scriptPath: process.env.SURYA_OCR_SCRIPT_PATH || path.join(__dirname, '../python/surya_ocr.py'),
  modelPath: process.env.SURYA_MODEL_PATH || path.join(__dirname, '../models/surya'),
  confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.7,
  timeout: parseInt(process.env.OCR_TIMEOUT) || 30000,
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_OCR) || 3,
  queueTimeout: parseInt(process.env.OCR_QUEUE_TIMEOUT) || 60000,
  
  settings: {
    languages: ['en'],
    detection_threshold: 0.4,
    text_threshold: 0.7,
    link_threshold: 0.4,
    canvas_size: 2560,
    mag_ratio: 1.5,
    slope_ths: 0.1,
    ycenter_ths: 0.5,
    height_ths: 0.7,
    width_ths: 0.7,
    add_margin: 0.1
  }
};

module.exports = suryaConfig;
