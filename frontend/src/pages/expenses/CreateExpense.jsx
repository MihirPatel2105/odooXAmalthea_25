import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';

const CreateExpense = () => {
  const navigate = useNavigate();
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await post('/expenses', data);
      navigate('/expenses');
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Create New Expense</h1>
      <p className="mt-2 text-sm text-gray-600">Fill in the details below to create a new expense.</p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Description"
            type="text"
            required
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 5,
                message: 'Description must be at least 5 characters long'
              }
            })}
            error={errors.description?.message}
          />
          
          <Input
            label="Amount"
            type="number"
            required
            {...register('amount.value', {
              required: 'Amount is required',
              min: {
                value: 0.01,
                message: 'Amount must be a positive number'
              }
            })}
            error={errors.amount?.value?.message}
          />
          
          <Input
            label="Currency"
            type="text"
            required
            {...register('amount.currency', {
              required: 'Currency is required',
              minLength: {
                value: 3,
                message: 'Currency must be a 3-letter code'
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
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
        >
          Create Expense
        </Button>
      </form>
    </div>
  );
};

export default CreateExpense;