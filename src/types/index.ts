// User and Authentication Types
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  MANAGER = 'manager',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Tour Types
export interface Tour {
  id: string;
  tourName: string;
  tourCode: string;
  destination: string;
  departureDate: Date;
  returnDate: Date;
  totalSeats: number;
  availableSeats: number;
  packagePrice: number;
  pickupCity: string;
  tourManager: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// Traveler and Booking Types
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface Traveler {
  id: string;
  bookingId: string;
  serialNumber: number;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  bookingCode: string;
  tourId: string;
  traveler: Traveler;
  pickupPoint: string;
  seatNumber: string;
  roomSharingPreference: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Document Types
export interface Document {
  id: string;
  bookingId: string;
  type: 'aadhaar' | 'pan' | 'passport' | 'visa' | 'ticket';
  url: string;
  fileName: string;
  uploadedAt: Date;
  expiryDate?: Date;
  status: 'verified' | 'pending' | 'expired';
}

// Payment Types
export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  PENDING = 'pending',
  OVERDUE = 'overdue',
}

export interface Payment {
  id: string;
  bookingId: string;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  status: PaymentStatus;
  paymentDate: Date;
  dueDate: Date;
  paymentMode: 'cash' | 'bank_transfer' | 'card' | 'upi';
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Operations Types
export interface RoomAllocation {
  id: string;
  tourId: string;
  roomNumber: string;
  capacity: number;
  occupants: string[];
  notes?: string;
}

export interface OperationsStatus {
  id: string;
  bookingId: string;
  pnr?: string;
  flightStatus?: 'confirmed' | 'pending' | 'cancelled' | 'not_required';
  visaStatus?: 'approved' | 'pending' | 'rejected' | 'not_required';
  hotelStatus?: 'confirmed' | 'pending' | 'cancelled' | 'not_required';
  ticketIssued: boolean;
  ticketDetails?: {
    airline?: string;
    flightNumber?: string;
    departureTime?: Date;
    arrivalTime?: Date;
  };
  bustrainDetails?: string;
  authenticationStatus: 'verified' | 'pending';
  lastUpdated: Date;
}

// Statistics Types
export interface DashboardStats {
  totalTours: number;
  activeTravelers: number;
  pendingPayments: number;
  upcomingDepartures: number;
  pendingDocuments: number;
  operationAlerts: number;
}

export interface TourStats {
  tourId: string;
  totalTravelers: number;
  seatsOccupied: number;
  seatsAvailable: number;
  paymentCompletionPercentage: number;
  totalRevenue: number;
  totalAdvancePaid: number;
  totalPending: number;
}
