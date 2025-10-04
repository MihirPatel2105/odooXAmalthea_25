import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, CreditCardIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const countries = [
  { name: 'United States', currency: 'USD', code: 'US' },
  { name: 'Canada', currency: 'CAD', code: 'CA' },
  { name: 'United Kingdom', currency: 'GBP', code: 'GB' },
  { name: 'Germany', currency: 'EUR', code: 'DE' },
  { name: 'India', currency: 'INR', code: 'IN' },
  { name: 'Australia', currency: 'AUD', code: 'AU' },
  { name: 'Japan', currency: 'JPY', code: 'JP' }
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm();

  const password = watch('password');
  const watchedCountry = watch('country');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (watchedCountry) {
      const country = countries.find(c => c.name === watchedCountry);
      if (country) {
        setSelectedCountry(country);
        setValue('currency', country.currency);
      }
    }
  }, [watchedCountry, setValue]);

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      role: 'admin', // First user becomes admin
      companyData: {
        name: data.companyName,
        country: data.country,
        currency: data.currency
      }
    };
    
    const result = await registerUser(formData);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <CreditCardIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up your company's expense management system
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
            {/* Personal Information */}
            <div>
              <div className="flex items-center mb-4">
                <CreditCardIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="First Name"
                  {...register('firstName', { 
                    required: 'First name is required',
                    minLength: { value: 2, message: 'First name must be at least 2 characters' }
                  })}
                  error={errors.firstName}
                  placeholder="Enter your first name"
                />
                <Input
                  label="Last Name"
                  {...register('lastName', { 
                    required: 'Last name is required',
                    minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                  })}
                  error={errors.lastName}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Email Address"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.email}
                  placeholder="Enter your work email"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' }
                    })}
                    error={errors.password}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  error={errors.confirmPassword}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              </div>

              <div className="mb-4">
                <Input
                  label="Company Name"
                  {...register('companyName', { 
                    required: 'Company name is required',
                    minLength: { value: 2, message: 'Company name must be at least 2 characters' }
                  })}
                  error={errors.companyName}
                  placeholder="Enter your company name"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    {...register('country', { required: 'Country is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>

                <Input
                  label="Base Currency"
                  {...register('currency')}
                  value={selectedCountry?.currency || ''}
                  readOnly
                  placeholder="Auto-selected"
                  className="bg-gray-50"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CreditCardIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      You're setting up as an Admin
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>As the first user, you'll have admin privileges to manage your company's expense system.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full"
              >
                Create Account & Company
              </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Already have an account? Sign in
            </Link>
          </div>
                </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
