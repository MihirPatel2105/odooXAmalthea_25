const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadReceipt, handleUploadError } = require('../middleware/upload');
const {
  processReceipt,
  validateOCR,
  getQueueStatus,
  testInstallation,
  reprocessReceipt
} = require('../controllers/ocrController');

// @route   POST /api/ocr/process
// @desc    Process receipt OCR
// @access  Private
router.post('/process', 
  authenticate,
  uploadReceipt,
  handleUploadError,
  processReceipt
);

// @route   POST /api/ocr/validate
// @desc    Validate OCR data against user input
// @access  Private
router.post('/validate', authenticate, validateOCR);

// @route   POST /api/ocr/reprocess
// @desc    Reprocess receipt with different settings
// @access  Private
router.post('/reprocess', authenticate, reprocessReceipt);

// @route   GET /api/ocr/queue-status
// @desc    Get OCR processing queue status
// @access  Private
router.get('/queue-status', authenticate, getQueueStatus);

// @route   GET /api/ocr/test
// @desc    Test Surya OCR installation
// @access  Private (Admin only)
router.get('/test', authenticate, authorize('admin'), testInstallation);

module.exports = router;
