const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const suryaConfig = require('../config/surya');

// OCR processing queue to limit concurrent operations
class OCRQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const ocrQueue = new OCRQueue(suryaConfig.maxConcurrent);

// Process receipt using Surya OCR
const processSuryaOCR = async (imagePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      languages = suryaConfig.settings.languages,
      modelPath = suryaConfig.modelPath,
      parseOnly = false
    } = options;

    if (!fs.existsSync(imagePath)) {
      return reject(new Error(`Image file not found: ${imagePath}`));
    }

    const args = [
      suryaConfig.scriptPath,
      imagePath,
      '--languages', ...languages
    ];

    if (modelPath) {
      args.push('--model-path', modelPath);
    }

    if (parseOnly) {
      args.push('--parse-only');
    }

    console.log(`Executing Surya OCR: ${suryaConfig.pythonPath} ${args.join(' ')}`);

    const pythonProcess = spawn(suryaConfig.pythonPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: suryaConfig.timeout
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse OCR result: ${parseError.message}\nOutput: ${stdout}`));
        }
      } else {
        reject(new Error(`Surya OCR process failed with code ${code}\nError: ${stderr}\nOutput: ${stdout}`));
      }
    });

    pythonProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(`Python executable not found: ${suryaConfig.pythonPath}. Please ensure Python is installed and accessible.`));
      } else {
        reject(new Error(`Failed to start Surya OCR process: ${error.message}`));
      }
    });

    pythonProcess.on('timeout', () => {
      pythonProcess.kill('SIGKILL');
      reject(new Error(`Surya OCR process timed out after ${suryaConfig.timeout}ms`));
    });
  });
};

// Main OCR processing function
exports.processReceiptOCR = async (imagePath, options = {}) => {
  try {
    console.log(`Processing receipt OCR for: ${imagePath}`);

    const result = await ocrQueue.add(async () => {
      return await processSuryaOCR(imagePath, options);
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'OCR processing failed'
      };
    }

    const { ocr_data, parsed_data, suggested_category } = result;

    const formattedResult = {
      success: true,
      data: {
        extractedText: ocr_data.extracted_text,
        confidence: ocr_data.confidence,
        merchantName: parsed_data.merchant_name,
        extractedAmount: parsed_data.total_amount,
        extractedDate: parsed_data.date ? new Date(parsed_data.date) : null,
        suggestedCategory: suggested_category,
        items: parsed_data.items || [],
        additionalData: {
          subtotal: parsed_data.subtotal,
          taxAmount: parsed_data.tax_amount,
          paymentMethod: parsed_data.payment_method,
          receiptNumber: parsed_data.receipt_number,
          address: parsed_data.address,
          phone: parsed_data.phone,
          processingTime: ocr_data.processing_time,
          language: ocr_data.language,
          imageSize: ocr_data.image_size,
          textBlocks: ocr_data.text_blocks
        }
      }
    };

    console.log(`OCR processing completed successfully. Confidence: ${ocr_data.confidence}`);
    return formattedResult;

  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate OCR results against user input
exports.validateOCRData = (ocrData, userInput) => {
  const validation = {
    isValid: true,
    warnings: [],
    suggestions: [],
    confidence: ocrData.confidence || 0
  };

  if (validation.confidence < suryaConfig.confidenceThreshold) {
    validation.warnings.push({
      field: 'general',
      message: `Low OCR confidence (${(validation.confidence * 100).toFixed(1)}%). Please verify extracted data.`
    });
  }

  if (ocrData.extractedAmount && userInput.amount) {
    const ocrAmount = parseFloat(ocrData.extractedAmount);
    const userAmount = parseFloat(userInput.amount);
    const difference = Math.abs(ocrAmount - userAmount);
    const percentageDiff = (difference / ocrAmount) * 100;
    
    if (percentageDiff > 10) {
      validation.warnings.push({
        field: 'amount',
        message: `OCR detected amount $${ocrAmount.toFixed(2)} differs significantly from entered amount $${userAmount.toFixed(2)} (${percentageDiff.toFixed(1)}% difference)`
      });
    }
  }

  if (ocrData.extractedDate && userInput.expenseDate) {
    const ocrDate = new Date(ocrData.extractedDate);
    const inputDate = new Date(userInput.expenseDate);
    const daysDifference = Math.abs((ocrDate - inputDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 1) {
      validation.warnings.push({
        field: 'date',
        message: `OCR detected date ${ocrDate.toDateString()} differs from entered date ${inputDate.toDateString()}`
      });
    }
  }

  if (ocrData.suggestedCategory) {
    if (!userInput.category) {
      validation.suggestions.push({
        field: 'category',
        suggestion: ocrData.suggestedCategory,
        message: `Based on receipt analysis, this appears to be a ${ocrData.suggestedCategory} expense`
      });
    } else if (userInput.category !== ocrData.suggestedCategory) {
      validation.suggestions.push({
        field: 'category',
        suggestion: ocrData.suggestedCategory,
        message: `OCR suggests this might be a ${ocrData.suggestedCategory} expense instead of ${userInput.category}`
      });
    }
  }

  if (ocrData.merchantName && !userInput.merchant) {
    validation.suggestions.push({
      field: 'merchant',
      suggestion: ocrData.merchantName,
      message: `Detected merchant: ${ocrData.merchantName}`
    });
  }

  if (ocrData.items && ocrData.items.length > 0) {
    const totalItemsAmount = ocrData.items.reduce((sum, item) => sum + (item.price || 0), 0);
    if (ocrData.extractedAmount && Math.abs(totalItemsAmount - ocrData.extractedAmount) > 0.01) {
      validation.warnings.push({
        field: 'items',
        message: `Sum of individual items ($${totalItemsAmount.toFixed(2)}) doesn't match total amount ($${ocrData.extractedAmount.toFixed(2)})`
      });
    }
  }

  return validation;
};

// Get OCR processing status
exports.getOCRQueueStatus = () => {
  return {
    queueLength: ocrQueue.queue.length,
    running: ocrQueue.running,
    maxConcurrent: ocrQueue.maxConcurrent
  };
};

// Test Surya OCR installation
exports.testSuryaInstallation = async () => {
  try {
    const testResult = await new Promise((resolve, reject) => {
      const pythonProcess = spawn(suryaConfig.pythonPath, ['-c', 'import surya; print("Surya OCR is available")'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, message: stdout.trim() });
        } else {
          reject(new Error(`Test failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(error);
      });
    });

    return testResult;

  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestion: 'Run: cd python && python setup.py to install Surya OCR dependencies'
    };
  }
};

// Batch OCR processing for multiple receipts
exports.batchProcessOCR = async (imagePaths, options = {}) => {
  const results = [];
  
  for (const imagePath of imagePaths) {
    try {
      const result = await exports.processReceiptOCR(imagePath, options);
      results.push({
        imagePath,
        ...result
      });
    } catch (error) {
      results.push({
        imagePath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};
