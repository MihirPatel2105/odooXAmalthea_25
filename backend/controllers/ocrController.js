const { processReceiptOCR, validateOCRData, getOCRQueueStatus, testTesseractInstallation } = require('../utils/tesseractOcrService');
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

    try {
      const ocrResult = await processReceiptOCR(imagePath, options);

      if (!ocrResult.success) {
        // If OCR fails, provide mock data as fallback
        console.warn('OCR processing failed, providing mock data:', ocrResult.error);
        
        const mockData = {
          amount: '0.00',
          date: new Date().toISOString().split('T')[0],
          vendor: 'Unknown Vendor',
          category: 'general',
          confidence: 0,
          note: 'OCR processing failed - please fill manually'
        };

        return res.json({
          success: true,
          message: 'Receipt uploaded successfully (OCR unavailable)',
          data: {
            extractedData: mockData,
            file: {
              filename: req.file.filename,
              originalName: req.file.originalname,
              size: req.file.size,
              mimeType: req.file.mimetype
            }
          }
        });
      }

      res.json({
        success: true,
        message: 'Receipt processed successfully',
        data: {
          extractedData: {
            amount: ocrResult.data.extractedAmount || '0.00',
            date: ocrResult.data.extractedDate ? 
              (ocrResult.data.extractedDate instanceof Date ? 
                ocrResult.data.extractedDate.toISOString().split('T')[0] : 
                ocrResult.data.extractedDate) : 
              new Date().toISOString().split('T')[0],
            vendor: ocrResult.data.merchantName || 'Unknown Vendor',
            category: ocrResult.data.suggestedCategory || 'general',
            confidence: ocrResult.data.confidence || 0,
            items: ocrResult.data.items || [],
            note: ocrResult.data.note || ''
          },
          file: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          }
        }
      });

    } catch (ocrError) {
      // If OCR throws an error, provide mock data as fallback
      console.warn('OCR processing threw error, providing mock data:', ocrError.message);
      
      const mockData = {
        amount: '0.00',
        date: new Date().toISOString().split('T')[0],
        vendor: 'Unknown Vendor',
        category: 'general',
        confidence: 0,
        note: 'OCR processing failed - please fill manually'
      };

      return res.json({
        success: true,
        message: 'Receipt uploaded successfully (OCR unavailable)',
        data: {
          extractedData: mockData,
          file: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          }
        }
      });
    }

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

// Test Tesseract OCR installation
exports.testInstallation = async (req, res) => {
  try {
    const result = await testTesseractInstallation();
    
    res.json({
      success: result.success,
      message: result.success ? result.message : result.error,
      suggestion: result.suggestion || null
    });

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
