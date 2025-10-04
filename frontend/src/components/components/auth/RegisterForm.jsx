import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Australia', 'Japan', 'India', 'Brazil', 'Mexico'
];

const RegisterForm = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          autoComplete="given-name"
          required
          {...register('firstName', {
            required: 'First name is required',
            minLength: {
              value: 2,
              message: 'First name must be at least 2 characters'
            }
          })}
          error={errors.firstName?.message}
        />

        <Input
          label="Last Name"
          type="text"
          autoComplete="family-name"
          required
          {...register('lastName', {
            required: 'Last name is required',
            minLength: {
              value: 2,
              message: 'Last name must be at least 2 characters'
            }
          })}
          error={errors.lastName?.message}
        />
      </div>

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        required
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })}
        error={errors.email?.message}
      />

      <Input
        label="Company Name"
        type="text"
        autoComplete="organization"
        required
        {...register('companyName', {
          required: 'Company name is required',
          minLength: {
            value: 2,
            message: 'Company name must be at least 2 characters'
          }
        })}
        error={errors.companyName?.message}
      />

      <div>
        <label className="label">Country</label>
        <select
          className="input"
          {...register('country', {
            required: 'Country is required'
          })}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="mt-1 text-sm text-danger-600">{errors.country.message}</p>
        )}
      </div>

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        required
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        }
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters'
          }
        })}
        error={errors.password?.message}
      />

      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        required
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: value => value === password || 'Passwords do not match'
        })}
        error={errors.confirmPassword?.message}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;
