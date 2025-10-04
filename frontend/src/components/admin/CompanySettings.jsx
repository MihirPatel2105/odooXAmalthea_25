import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { get, put } = useApi();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm();

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const response = await get('/admin/settings');
      const { company } = response.data;
      
      setValue('name', company.name);
      setValue('maxExpenseAmount', company.settings.maxExpenseAmount);
      setValue('autoApprovalLimit', company.settings.autoApprovalLimit);
      setValue('isManagerApprover', company.settings.isManagerApprover);
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await put('/admin/settings', {
        name: data.name,
        settings: {
          maxExpenseAmount: parseFloat(data.maxExpenseAmount),
          autoApprovalLimit: parseFloat(data.autoApprovalLimit),
          isManagerApprover: data.isManagerApprover
        }
      });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your company's expense management configuration.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Company Name"
                type="text"
                required
                {...register('name', {
                  required: 'Company name is required'
                })}
                error={errors.name?.message}
              />
            </div>

            <Input
              label="Maximum Expense Amount"
              type="number"
              step="0.01"
              min="0"
              required
              helper="Maximum amount for a single expense"
              {...register('maxExpenseAmount', {
                required: 'Maximum expense amount is required',
                min: { value: 0, message: 'Amount must be positive' }
              })}
              error={errors.maxExpenseAmount?.message}
            />

            <Input
              label="Auto Approval Limit"
              type="number"
              step="0.01"
              min="0"
              required
              helper="Expenses below this amount are automatically approved"
              {...register('autoApprovalLimit', {
                required: 'Auto approval limit is required',
                min: { value: 0, message: 'Amount must be positive' }
              })}
              error={errors.autoApprovalLimit?.message}
            />

            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="isManagerApprover"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('isManagerApprover')}
                />
                <label htmlFor="isManagerApprover" className="ml-2 block text-sm text-gray-900">
                  Managers can approve expenses from their team members
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={!isDirty}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving || !isDirty}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </div>

      <Alert
        type="info"
        title="Important Note"
        message="Changes to expense limits and approval settings will only affect new expenses submitted after the changes are saved."
      />
    </div>
  );
};

export default CompanySettings;
