import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  CameraIcon, 
  DocumentIcon, 
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software & Subscriptions' },
  { value: 'training', label: 'Training & Education' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

const CreateExpense = () => {
  const navigate = useNavigate();
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [backendErrors, setBackendErrors] = useState([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      currency: 'USD'
    }
  });

  const selectedCurrency = watch('currency');
  const currentCurrencySymbol = CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$';

  const onDrop = useCallback(async (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);

    // Process OCR for the first file
    if (acceptedFiles.length > 0) {
      await processOCR(acceptedFiles[0]);
    }
  }, []);

  const processOCR = async (file) => {
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await post('/ocr/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.extractedData) {
        const { extractedData } = response.data;
        setOcrData(extractedData);

        // Auto-fill form fields with better validation
        if (extractedData.amount && extractedData.amount !== '0.00') {
          const amount = parseFloat(extractedData.amount);
          if (!isNaN(amount) && amount > 0) {
            setValue('amount', amount);
          }
        }
        
        if (extractedData.date && extractedData.date !== new Date().toISOString().split('T')[0]) {
          // Try to parse and format the date properly
          let formattedDate = extractedData.date;
          try {
            // Handle various date formats
            if (extractedData.date.includes('/')) {
              const parts = extractedData.date.split('/');
              if (parts.length === 3) {
                // Convert MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
                let year = parts[2];
                let month = parts[0];
                let day = parts[1];
                
                // If year is 2-digit, convert to 4-digit
                if (year.length === 2) {
                  year = '20' + year;
                }
                
                // Ensure month and day are 2-digit
                month = month.padStart(2, '0');
                day = day.padStart(2, '0');
                
                formattedDate = `${year}-${month}-${day}`;
              }
            } else if (extractedData.date.includes('-')) {
              // Already in good format, validate it
              const dateTest = new Date(extractedData.date);
              if (!isNaN(dateTest.getTime())) {
                formattedDate = extractedData.date;
              }
            }
            
            setValue('date', formattedDate);
          } catch (e) {
            console.warn('Date parsing failed:', e);
          }
        }
        
        if (extractedData.vendor && extractedData.vendor !== 'Unknown Vendor') {
          setValue('vendor', extractedData.vendor);
        }
        
        if (extractedData.category && extractedData.category !== 'general') {
          setValue('category', extractedData.category);
        }

        // Auto-detect currency if possible (for future enhancement)
        // Could look for $ or other currency symbols in the text
        
        // Show success message with details
        const extractedFields = [];
        if (extractedData.amount && extractedData.amount !== '0.00') extractedFields.push('amount');
        if (extractedData.date && extractedData.date !== new Date().toISOString().split('T')[0]) extractedFields.push('date');
        if (extractedData.vendor && extractedData.vendor !== 'Unknown Vendor') extractedFields.push('vendor');
        if (extractedData.category && extractedData.category !== 'general') extractedFields.push('category');
        
        if (extractedFields.length > 0) {
          toast.success(`Receipt processed! Auto-filled: ${extractedFields.join(', ')}`);
        } else {
          toast.success('Receipt uploaded! Please fill in the details manually.');
        }
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      toast.error('Failed to process receipt. Please fill manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10485760, // 10MB
    multiple: true
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setBackendErrors([]);
    try {
      const formData = new FormData();
      
      // Add expense data
  formData.append('amount[value]', data.amount);
  formData.append('amount[currency]', data.currency);
  formData.append('category', data.category);
  formData.append('description', data.description);
  formData.append('expenseDate', data.date);
  formData.append('merchantName', data.vendor || '');

      // Add receipt files
      files.forEach((fileObj, index) => {
        formData.append(`receipts`, fileObj.file);
      });

      await post('/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Expense submitted successfully!');
      navigate('/expenses');
    } catch (error) {
      console.error('Failed to create expense:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        setBackendErrors(error.response.data.errors);
      }
      toast.error('Failed to submit expense. Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit New Expense</h1>
        <p className="mt-2 text-lg text-gray-600">
          Upload your receipt and let AI extract the details automatically
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {backendErrors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc pl-5">
              {backendErrors.map((err, idx) => (
                <li key={idx}>{err.msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Receipt Upload Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CameraIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Receipt Upload</h2>
            {ocrLoading && (
              <div className="ml-4 flex items-center">
                <SparklesIcon className="h-5 w-5 text-yellow-500 animate-spin mr-2" />
                <span className="text-sm text-yellow-600">Processing with AI...</span>
              </div>
            )}
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop receipts here' : 'Upload receipt'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Drag & drop or click to select images/PDFs (Max 10MB each)
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports: JPEG, PNG, PDF
            </p>
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Uploaded Receipts ({files.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((fileObj) => (
                  <div key={fileObj.id} className="relative group">
                    <div className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden bg-gray-100">
                      {fileObj.file.type.startsWith('image/') ? (
                        <img
                          src={fileObj.preview}
                          alt="Receipt preview"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <DocumentIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileObj.id)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    <p className="mt-2 text-xs text-gray-600 truncate">
                      {fileObj.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OCR Results */}
          {ocrData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <SparklesIcon className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-green-800">
                  AI Extracted Data
                </h3>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>Amount: {ocrData.amount}</p>
                <p>Date: {ocrData.date}</p>
                <p>Vendor: {ocrData.vendor}</p>
                <p>Category: {ocrData.category}</p>
              </div>
            </div>
          )}
        </div>

        {/* Expense Details */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-6">
            <CurrencyDollarIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Expense Details</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Amount and Currency */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="relative">
                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be positive' }
                    })}
                    error={errors.amount}
                    placeholder="0.00"
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-8 text-gray-500 text-sm">
                    {currentCurrencySymbol}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  {...register('currency', { required: 'Currency is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <Input
                label={
                  <span>
                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                    Date
                  </span>
                }
                type="date"
                {...register('date', { required: 'Date is required' })}
                error={errors.date}
              />
            </div>

            {/* Vendor */}
            <Input
              label="Vendor/Merchant"
              {...register('vendor')}
              error={errors.vendor}
              placeholder="e.g., Starbucks, Amazon, etc."
            />

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 5, message: 'Description must be at least 5 characters' }
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe the business purpose of this expense..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expenses')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={loading || isSubmitting}
            disabled={files.length === 0}
          >
            Submit Expense
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateExpense;
