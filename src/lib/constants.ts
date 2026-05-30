// Utility functions and constants

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TOURS: '/tours',
  BOOKINGS: '/bookings',
  TRAVELERS: '/travelers',
  PAYMENTS: '/payments',
  CUSTOMER_PAYMENTS: '/customer-payments',
  OPERATIONS: '/operations',
  DOCUMENTS: '/documents',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  EMPLOYEE_ACCESS: '/employee-access',
} as const;

export const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  confirmed: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
  archived: 'bg-gray-300 text-gray-700',
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  verified: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
} as const;

export const PAYMENT_STATUSES = {
  PAID: 'paid',
  PARTIAL: 'partial',
  PENDING: 'pending',
  OVERDUE: 'overdue',
} as const;

export const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'ticket', label: 'Ticket' },
] as const;

export const ROOM_SHARING_OPTIONS = [
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Sharing' },
  { value: 'triple', label: 'Triple Sharing' },
  { value: 'quad', label: 'Quad Sharing' },
] as const;

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'upi', label: 'UPI' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

// Format helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const generateBookingCode = (): string => {
  const date = new Date();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${random}`;
};

export const generateTourCode = (): string => {
  const date = new Date();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${random}`;
};
