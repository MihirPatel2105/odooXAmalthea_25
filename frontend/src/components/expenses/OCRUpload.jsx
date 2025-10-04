import React, { useState } from 'react';
import FileUpload from '../common/FileUpload';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { useApi } from '../../hooks/useApi';

const OCRUpload = ({ onOCRResult }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { post } = useApi();

  const processOCR = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('receipt', file.file);
      
      const response = await post('/ocr/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      if (onOCRResult) {
        onOCRResult(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OCR processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload
        onFileSelect={setFile}
        accept={{
          'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
          'application/pdf': ['.pdf']
        }}
      />

      {file && (
        <div className="flex justify-center">
          <Button
            onClick={processOCR}
            loading={processing}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Extract Data from Receipt'}
          </Button>
        </div>
      )}

      {processing && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-sm text-gray-600">
            Processing receipt with OCR...
          </span>
        </div>
      )}

      {error && (
        <Alert type="error" message={error} />
      )}

      {result && (
        <div className="card bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            OCR Results
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.ocrData.merchantName && (
              <div>
                <p className="text-sm text-green-700">Merchant Name</p>
                <p className="font-medium text-green-900">
                  {result.ocrData.merchantName}
                </p>
              </div>
            )}
            
            {result.ocrData.extractedAmount && (
              <div>
                <p className="text-sm text-green-700">Amount</p>
                <p className="font-medium text-green-900">
                  ${result.ocrData.extractedAmount}
                </p>
              </div>
            )}
            
            {result.ocrData.extractedDate && (
              <div>
                <p className="text-sm text-green-700">Date</p>
                <p className="font-medium text-green-900">
                  {new Date(result.ocrData.extractedDate).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {result.ocrData.suggestedCategory && (
              <div>
                <p className="text-sm text-green-700">Suggested Category</p>
                <p className="font-medium text-green-900">
                  {result.ocrData.suggestedCategory}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-green-700">Confidence</p>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${result.ocrData.confidence * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {(result.ocrData.confidence * 100).toFixed(1)}% confident
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRUpload;
