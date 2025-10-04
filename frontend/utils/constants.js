export const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' }
];

export const EXPENSE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'processing', label: 'Processing', color: 'blue' },
  { value: 'reimbursed', label: 'Reimbursed', color: 'purple' }
];

export const USER_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Administrator' }
];

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
];

export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL_RECEIPTS: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh-token'
  },
  EXPENSES: {
    LIST: '/expenses/my',
    CREATE: '/expenses',
    DETAIL: '/expenses',
    UPDATE: '/expenses',
    DELETE: '/expenses',
    APPROVE: '/expenses',
    ANALYTICS: '/expenses/analytics',
    EXPORT: '/expenses/export'
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings',
    REPORTS: '/admin/reports'
  },
  OCR: {
    PROCESS: '/ocr/process',
    VALIDATE: '/ocr/validate',
    TEST: '/ocr/test'
  }
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  '#EC4899', '#6B7280'
];

// Default filter values
export const DEFAULT_FILTERS = {
  status: '',
  category: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 12,
  search: ''
};

// Status badge configurations
export const STATUS_BADGES = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-blue-100 text-blue-800',
  reimbursed: 'bg-purple-100 text-purple-800'
};
