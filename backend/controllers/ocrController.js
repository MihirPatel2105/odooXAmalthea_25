const { processReceiptOCR, validateOCRData, getOCRQueueStatus, testSuryaInstallation } = require('../utils/suryaOcrService');
const path = require('path');
const fs = require('fs');

// Process uploaded receipt
exports.processReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file uploaded'
      });
    }

    const imagePath = req.file.path;
    const options = {
      languages: req.body.languages ? req.body.languages.split(',') : ['en']
    };

    console.log(`Processing receipt: ${imagePath}`);

    const ocrResult = await processReceiptOCR(imagePath, options);

    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        message: 'OCR processing failed',
        error: ocrResult.error
      });
    }

    res.json({
      success: true,
      message: 'Receipt processed successfully',
      data: {
        ocrData: ocrResult.data,
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      }
    });

  } catch (error) {
    console.error('Receipt processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Receipt processing failed',
      error: error.message
    });
  }
};

// Validate OCR data against user input
exports.validateOCR = async (req, res) => {
  try {
    const { ocrData, userInput } = req.body;

    if (!ocrData || !userInput) {
      return res.status(400).json({
        success: false,
        message: 'OCR data and user input are required'
      });
    }

    const validation = validateOCRData(ocrData, userInput);

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('OCR validation error:', error);
    res.status(500).json({
      success: false,
      message: 'OCR validation failed',
      error: error.message
    });
  }
};

// Get OCR processing queue status
exports.getQueueStatus = async (req, res) => {
  try {
    const status = getOCRQueueStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status',
      error: error.message
    });
  }
};

// Test Surya OCR installation
exports.testInstallation = async (req, res) => {
  try {
    const testResult = await testSuryaInstallation();
    
    if (testResult.success) {
      res.json({
        success: true,
        message: 'Surya OCR is properly installed and configured',
        data: testResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Surya OCR installation test failed',
        error: testResult.error,
        suggestion: testResult.suggestion
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Installation test failed',
      error: error.message
    });
  }
};

// Reprocess receipt with different settings
exports.reprocessReceipt = async (req, res) => {
  try {
    const { filename, languages, parseOnly } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const imagePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Receipt file not found'
      });
    }

    const options = {
      languages: languages ? languages.split(',') : ['en'],
      parseOnly: parseOnly || false
    };

    const ocrResult = await processReceiptOCR(imagePath, options);

    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        message: 'OCR reprocessing failed',
        error: ocrResult.error
      });
    }

    res.json({
      success: true,
      message: 'Receipt reprocessed successfully',
      data: ocrResult.data
    });

  } catch (error) {
    console.error('Receipt reprocessing error:', error);
    res.status(500).json({
      success: false,
      message: 'Receipt reprocessing failed',
      error: error.message
    });
  }
};
