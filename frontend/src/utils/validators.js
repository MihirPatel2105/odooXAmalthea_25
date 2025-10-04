export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

export const validateNumber = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

export const validatePositiveNumber = (value) => {
  return validateNumber(value) && parseFloat(value) > 0;
};

export const validateDate = (date) => {
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

export const validateFileSize = (file, maxSizeInBytes) => {
  return file.size <= maxSizeInBytes;
};

export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

export const validateCurrency = (currency) => {
  return currency && currency.length === 3;
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};
