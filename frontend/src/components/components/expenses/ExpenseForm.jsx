import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
import FileUpload from '../common/FileUpload';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

const ExpenseForm = ({ initialData, onSubmit, loading = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: initialData
  });

  const onFormSubmit = async (data) => {
    const formData = new FormData();
    
    // Append form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'amount') {
        formData.append('amount[value]', value.value);
        formData.append('amount[currency]', value.currency);
      } else {
        formData.append(key, value);
      }
    });

    // Append file if selected
    if (selectedFile) {
      formData.append('receipt', selectedFile);
    }

    await onSubmit(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Description"
            type="text"
            required
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 5,
                message: 'Description must be at least 5 characters'
              }
            })}
            error={errors.description?.message}
          />
        </div>

        <Input
          label="Amount"
          type="number"
          step="0.01"
          required
          {...register('amount.value', {
            required: 'Amount is required',
            min: {
              value: 0.01,
              message: 'Amount must be positive'
            }
          })}
          error={errors.amount?.value?.message}
        />

        <Input
          label="Currency"
          type="text"
          placeholder="USD"
          required
          {...register('amount.currency', {
            required: 'Currency is required',
            pattern: {
              value: /^[A-Z]{3}$/,
              message: 'Currency must be 3 letters (e.g., USD)'
            }
          })}
          error={errors.amount?.currency?.message}
        />

        <div>
          <label className="label">Category</label>
          <select
            className="input"
            {...register('category', {
              required: 'Category is required'
            })}
          >
            <option value="">Select a category</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-danger-600">{errors.category.message}</p>
          )}
        </div>

        <Input
          label="Merchant Name"
          type="text"
          {...register('merchantName')}
          error={errors.merchantName?.message}
        />

        <Input
          label="Expense Date"
          type="date"
          required
          {...register('expenseDate', {
            required: 'Expense date is required'
          })}
          error={errors.expenseDate?.message}
        />

        <div className="sm:col-span-2">
          <Input
            label="Tags (comma separated)"
            type="text"
            placeholder="business, travel, client meeting"
            {...register('tags')}
            helper="Add tags to help categorize your expense"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Receipt</label>
          <FileUpload
            onFileSelect={setSelectedFile}
            accept="image/*,.pdf"
            maxSize={5 * 1024 * 1024}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
        >
          Submit Expense
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
