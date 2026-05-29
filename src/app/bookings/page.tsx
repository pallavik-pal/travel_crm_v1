'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, GENDER_OPTIONS, PAYMENT_MODES, ROOM_SHARING_OPTIONS } from '@/lib/constants';
import { useRecords } from '@/lib/use-records';
import { Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

type BookingMemberRecord = {
  id: string;
  serialNumber: number | null;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  relation: string;
  aadhaarFileName?: string;
  panFileName?: string;
  passportFileName?: string;
  additionalDocuments?: AdditionalDocumentForm[];
};

type BookingRecord = {
  id: string;
  bookingCode: string;
  bookedBy: string;
  travelerName: string;
  tour: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  aadhaarFileName?: string;
  panFileName?: string;
  passportFileName?: string;
  additionalDocuments?: AdditionalDocumentForm[];
  memberCount: number;
  members: BookingMemberRecord[];
  seat: string;
  roomSharing: string;
  pickupPoint: string;
  totalAmount: number;
  advancePaid: number;
  balance: number;
  paymentDate: string;
  dueDate: string;
  paymentMode: string;
  transactionId: string;
  pnr: string;
  flightStatus: string;
  visaStatus: string;
  hotelStatus: string;
  paymentStatus: string;
  status: string;
};

const mockBookings: BookingRecord[] = [
  {
    id: '1',
    bookingCode: 'BK-202505-ABC123',
    bookedBy: '',
    travelerName: 'Rajesh Kumar',
    tour: 'Thailand May Batch',
    phone: '9876543210',
    email: 'rajesh@email.com',
    gender: '',
    dateOfBirth: '',
    address: '',
    memberCount: 0,
    members: [],
    seat: 'A-01',
    roomSharing: 'double',
    pickupPoint: '',
    totalAmount: 45000,
    advancePaid: 35000,
    balance: 10000,
    paymentDate: '',
    dueDate: '',
    paymentMode: '',
    transactionId: '',
    pnr: '',
    flightStatus: '',
    visaStatus: '',
    hotelStatus: '',
    paymentStatus: 'partial',
    status: 'confirmed',
  },
  {
    id: '2',
    bookingCode: 'BK-202505-DEF456',
    bookedBy: '',
    travelerName: 'Priya Singh',
    tour: 'Thailand May Batch',
    phone: '9876543211',
    email: 'priya@email.com',
    gender: '',
    dateOfBirth: '',
    address: '',
    memberCount: 0,
    members: [],
    seat: 'A-02',
    roomSharing: 'single',
    pickupPoint: '',
    totalAmount: 45000,
    advancePaid: 45000,
    balance: 0,
    paymentDate: '',
    dueDate: '',
    paymentMode: '',
    transactionId: '',
    pnr: '',
    flightStatus: '',
    visaStatus: '',
    hotelStatus: '',
    paymentStatus: 'paid',
    status: 'confirmed',
  },
  {
    id: '3',
    bookingCode: 'BK-202505-GHI789',
    bookedBy: '',
    travelerName: 'Amit Patel',
    tour: 'Kashmir June Batch',
    phone: '9876543212',
    email: 'amit@email.com',
    gender: '',
    dateOfBirth: '',
    address: '',
    memberCount: 0,
    members: [],
    seat: 'B-01',
    roomSharing: 'triple',
    pickupPoint: '',
    totalAmount: 35000,
    advancePaid: 15000,
    balance: 20000,
    paymentDate: '',
    dueDate: '',
    paymentMode: '',
    transactionId: '',
    pnr: '',
    flightStatus: '',
    visaStatus: '',
    hotelStatus: '',
    paymentStatus: 'pending',
    status: 'confirmed',
  },
];

type FamilyMemberForm = {
  id: string;
  serialNumber?: number | null;
  passengerType: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  relation: string;
  aadhaarFileName: string;
  panFileName: string;
  passportFileName: string;
  additionalDocuments: AdditionalDocumentForm[];
};

type DocumentNames = {
  aadhaarFileName: string;
  panFileName: string;
};

type AdditionalDocumentForm = {
  id: string;
  type: string;
  fileName: string;
};

type RoomPreferenceForm = {
  id: string;
  preferenceType: string;
};

const mockTours = [
  { id: 'thailand', tourName: 'Thailand May Batch', packagePrice: 45000, childPrice: 30000 },
  { id: 'kashmir', tourName: 'Kashmir June Batch', packagePrice: 35000, childPrice: 25000 },
  { id: 'dubai', tourName: 'Dubai July Batch', packagePrice: 55000, childPrice: 40000 },
];

const ADDITIONAL_DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'photo', label: 'Photo' },
  { value: 'visa', label: 'Visa' },
];

const PASSENGER_TYPE_OPTIONS = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
];

const BOOKING_STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refund', label: 'Refund' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const normalizePaymentStatus = (status: string) =>
  status === 'completed' ? 'paid' : status;

const formatStatusLabel = (status: string) =>
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const parseRoomPreferences = (roomSharing: string): RoomPreferenceForm[] => {
  if (!roomSharing) return [];

  try {
    const rooms = JSON.parse(roomSharing);

    if (!Array.isArray(rooms)) {
      return [];
    }

    return rooms.map((room) => ({
      id: crypto.randomUUID(),
      preferenceType:
        typeof room.preferenceType === 'string' ? room.preferenceType : '',
    }));
  } catch {
    return [
      {
        id: crypto.randomUUID(),
        preferenceType: roomSharing,
      },
    ];
  }
};

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
};

const getFullName = (firstName: string, lastName: string) =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const readJsonResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(response.ok ? 'The server returned an invalid response' : text);
  }
};

export default function BookingsPage() {
  const [bookings, setBookings] = useRecords('/api/bookings', [] as typeof mockBookings);
  const [tours] = useRecords('/api/tours', [] as typeof mockTours);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tourFilter, setTourFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([]);
  const [roomPreferences, setRoomPreferences] = useState<RoomPreferenceForm[]>([]);
  const [advancePaidInput, setAdvancePaidInput] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('');
  const [mainPassengerType, setMainPassengerType] = useState('adult');
  const [documentNames, setDocumentNames] = useState<DocumentNames>({
    aadhaarFileName: '',
    panFileName: '',
  });
  const [additionalDocuments, setAdditionalDocuments] = useState<AdditionalDocumentForm[]>([]);

  const selectedTour =
    tours.find((tour) => tour.id === selectedTourId) ??
    tours.find((tour) => tour.tourName === editingBooking?.tour);
  const adultCount =
    (mainPassengerType === 'adult' ? 1 : 0) +
    familyMembers.filter((member) => member.passengerType === 'adult').length;
  const childCount =
    (mainPassengerType === 'child' ? 1 : 0) +
    familyMembers.filter((member) => member.passengerType === 'child').length;
  const calculatedTotalAmount =
    adultCount * Number(selectedTour?.packagePrice ?? 0) +
    childCount * Number(selectedTour?.childPrice ?? 0);

  const calculatedBalance = Math.max(
    calculatedTotalAmount - Number(advancePaidInput || 0),
    0
  );
  const editingName = splitName(editingBooking?.travelerName ?? '');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('action') !== 'create') {
      return;
    }

    window.setTimeout(() => {
      setEditingBooking(null);
      setViewingBooking(null);
      setFamilyMembers([]);
      setRoomPreferences([]);
      setAdvancePaidInput('');
      setSelectedTourId('');
      setMainPassengerType('adult');
      setDocumentNames({ aadhaarFileName: '', panFileName: '' });
      setAdditionalDocuments([]);
      setFormError('');
      setShowForm(true);
    }, 0);
  }, []);

  const handleSaveBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileName = (name: string) => {
      const value = formData.get(name);
      return value instanceof File && value.name ? value.name : '';
    };

    if (familyMembers.some((member) => !member.phone.trim())) {
      setFormError('Phone number is required for every family member.');
      setIsSaving(false);
      return;
    }

    const mainDocuments = {
      aadhaar: fileName('aadhaar') || documentNames.aadhaarFileName,
      pan: fileName('pan') || documentNames.panFileName,
    };
    const missingMainDocument = Object.entries(mainDocuments).find(([, value]) => !value);

    if (missingMainDocument) {
      setFormError('Aadhaar and PAN are required for the main passenger.');
      setIsSaving(false);
      return;
    }

    const memberMissingDocuments = familyMembers.find(
      (member) =>
        !member.aadhaarFileName || !member.panFileName
    );

    if (memberMissingDocuments) {
      const memberName =
        getFullName(memberMissingDocuments.firstName, memberMissingDocuments.lastName) ||
        'each family member';
      setFormError(`Aadhaar and PAN are required for ${memberName}.`);
      setIsSaving(false);
      return;
    }

    const hasIncompleteMainDocument = additionalDocuments.some(
      (document) => !document.type || !document.fileName
    );

    if (hasIncompleteMainDocument) {
      setFormError('Please select a type and file for every additional main passenger document.');
      setIsSaving(false);
      return;
    }

    const memberWithIncompleteDocument = familyMembers.find((member) =>
      member.additionalDocuments.some((document) => !document.type || !document.fileName)
    );

    if (memberWithIncompleteDocument) {
      const memberName =
        getFullName(memberWithIncompleteDocument.firstName, memberWithIncompleteDocument.lastName) ||
        'the family member';
      setFormError(`Please select a type and file for every additional document for ${memberName}.`);
      setIsSaving(false);
      return;
    }

    const payload = {
      id: editingBooking?.id ?? '',
      familyMembers: familyMembers.map((member) => ({
        ...member,
        fullName: getFullName(member.firstName, member.lastName),
        aadhaarFileField: `family-${member.id}-aadhaar`,
        panFileField: `family-${member.id}-pan`,
        additionalDocuments: member.additionalDocuments.map((document) => ({
          ...document,
          fileField: `family-${member.id}-document-${document.id}`,
        })),
      })),
      additionalDocuments: additionalDocuments.map((document) => ({
        ...document,
        fileField: `document-${document.id}`,
      })),
      roomPreferences,
      totalAmount: calculatedTotalAmount,
      aadhaarFileName: mainDocuments.aadhaar,
      panFileName: mainDocuments.pan,
    };

    Object.entries(payload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.set(key, JSON.stringify(value));
        return;
      }

      formData.set(key, String(value ?? ''));
    });

    try {
      const response = await fetch('/api/bookings', {
        method: editingBooking ? 'PATCH' : 'POST',
        body: formData,
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to create booking');
      }

      if (!data?.id) {
        throw new Error('Booking was saved, but the server did not return the saved booking.');
      }

      const bookingsResponse = await fetch('/api/bookings', { cache: 'no-store' });
      const latestBookings = await readJsonResponse(bookingsResponse);

      if (!bookingsResponse.ok || !Array.isArray(latestBookings)) {
        throw new Error('Booking was saved, but the booking list could not be refreshed.');
      }

      setBookings(latestBookings);
      setSearchQuery('');
      setTourFilter('');
      setPaymentFilter('');
      setStatusFilter('');
      form.reset();
      setEditingBooking(null);
      setFamilyMembers([]);
      setRoomPreferences([]);
      setAdvancePaidInput('');
      setSelectedTourId('');
      setMainPassengerType('adult');
      setDocumentNames({ aadhaarFileName: '', panFileName: '' });
      setAdditionalDocuments([]);
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingBooking = (booking: BookingRecord) => {
    setEditingBooking(booking);
    setFamilyMembers(
      (booking.members ?? []).map((member) => ({
        id: member.id,
        serialNumber: member.serialNumber,
        passengerType: 'adult',
        ...splitName(member.fullName),
        fullName: member.fullName,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : '',
        phone: member.phone,
        email: member.email,
        relation: member.relation,
        aadhaarFileName: member.aadhaarFileName ?? '',
        panFileName: member.panFileName ?? '',
        passportFileName: member.passportFileName ?? '',
        additionalDocuments:
          member.additionalDocuments?.length
            ? member.additionalDocuments
            : member.passportFileName
              ? [{ id: crypto.randomUUID(), type: 'passport', fileName: member.passportFileName }]
              : [],
      }))
    );
    setRoomPreferences(parseRoomPreferences(booking.roomSharing));
    setSelectedTourId(tours.find((tour) => tour.tourName === booking.tour)?.id ?? '');
    setAdvancePaidInput(String(booking.advancePaid ?? ''));
    setMainPassengerType('adult');
    setDocumentNames({
      aadhaarFileName: booking.aadhaarFileName ?? '',
      panFileName: booking.panFileName ?? '',
    });
    setAdditionalDocuments(
      booking.additionalDocuments?.length
        ? booking.additionalDocuments
        : booking.passportFileName
          ? [{ id: crypto.randomUUID(), type: 'passport', fileName: booking.passportFileName }]
          : []
    );
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setEditingBooking(null);
    setFamilyMembers([]);
    setRoomPreferences([]);
    setAdvancePaidInput('');
    setSelectedTourId('');
    setMainPassengerType('adult');
    setDocumentNames({ aadhaarFileName: '', panFileName: '' });
    setAdditionalDocuments([]);
    setFormError('');
    setShowForm(false);
  };

  const addFamilyMember = () => {
    setFamilyMembers((currentMembers) => [
      ...currentMembers,
      {
        id: crypto.randomUUID(),
        serialNumber: null,
        passengerType: 'adult',
        firstName: '',
        lastName: '',
        fullName: '',
        gender: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        relation: '',
        aadhaarFileName: '',
        panFileName: '',
        passportFileName: '',
        additionalDocuments: [],
      },
    ]);
  };

  const addRoomPreference = () => {
    setRoomPreferences((currentRooms) => [
      ...currentRooms,
      {
        id: crypto.randomUUID(),
        preferenceType: '',
      },
    ]);
  };

  const updateRoomPreference = (
    id: string,
    field: keyof RoomPreferenceForm,
    value: string
  ) => {
    setRoomPreferences((currentRooms) =>
      currentRooms.map((room) =>
        room.id === id ? { ...room, [field]: value } : room
      )
    );
  };

  const removeRoomPreference = (id: string) => {
    setRoomPreferences((currentRooms) =>
      currentRooms.filter((room) => room.id !== id)
    );
  };

  const updateFamilyMember = (
    id: string,
    field: keyof FamilyMemberForm,
    value: string | AdditionalDocumentForm[]
  ) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === id
          ? {
              ...member,
              [field]: value,
              fullName:
                field === 'firstName' && typeof value === 'string'
                  ? getFullName(value, member.lastName)
                  : field === 'lastName' && typeof value === 'string'
                    ? getFullName(member.firstName, value)
                    : member.fullName,
            }
          : member
      )
    );
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== id)
    );
  };

  const addAdditionalDocument = () => {
    setAdditionalDocuments((currentDocuments) => [
      ...currentDocuments,
      { id: crypto.randomUUID(), type: '', fileName: '' },
    ]);
  };

  const updateAdditionalDocument = (
    id: string,
    field: keyof AdditionalDocumentForm,
    value: string
  ) => {
    setAdditionalDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === id ? { ...document, [field]: value } : document
      )
    );
  };

  const removeAdditionalDocument = (id: string) => {
    setAdditionalDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.id !== id)
    );
  };

  const addFamilyAdditionalDocument = (memberId: string) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              additionalDocuments: [
                ...member.additionalDocuments,
                { id: crypto.randomUUID(), type: '', fileName: '' },
              ],
            }
          : member
      )
    );
  };

  const updateFamilyAdditionalDocument = (
    memberId: string,
    documentId: string,
    field: keyof AdditionalDocumentForm,
    value: string
  ) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              additionalDocuments: member.additionalDocuments.map((document) =>
                document.id === documentId ? { ...document, [field]: value } : document
              ),
            }
          : member
      )
    );
  };

  const removeFamilyAdditionalDocument = (memberId: string, documentId: string) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              additionalDocuments: member.additionalDocuments.filter(
                (document) => document.id !== documentId
              ),
            }
          : member
      )
    );
  };

  const filterOptions = useMemo(() => {
    const tourNames = new Set<string>();

    bookings.forEach((booking) => {
      if (booking.tour) {
        tourNames.add(booking.tour);
      }
    });

    tours.forEach((tour) => {
      if (tour.tourName) {
        tourNames.add(tour.tourName);
      }
    });

    return {
      tours: Array.from(tourNames).sort((a, b) => a.localeCompare(b)),
    };
  }, [bookings, tours]);

  const filteredBookings = bookings.filter((booking) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      booking.travelerName.toLowerCase().includes(query) ||
      booking.bookingCode.toLowerCase().includes(query) ||
      booking.phone.includes(query);
    const matchesTour = !tourFilter || booking.tour === tourFilter;
    const matchesPayment =
      !paymentFilter || normalizePaymentStatus(booking.paymentStatus) === paymentFilter;
    const matchesStatus = !statusFilter || booking.status === statusFilter;

    return matchesSearch && matchesTour && matchesPayment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refund: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[normalizePaymentStatus(status)] || 'bg-gray-100 text-gray-800';
  };

  const filterSelectClassName = (isActive: boolean) =>
    `h-9 w-fit max-w-full rounded-full py-0 pl-3 pr-2 [field-sizing:content] ${
      isActive
        ? 'border-blue-600 bg-blue-600 text-white focus:ring-blue-600'
        : 'border-gray-300 bg-white text-gray-900'
    }`;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Manage traveler bookings and details</p>
          </div>
          <Button
            onClick={() => {
              setEditingBooking(null);
              setFamilyMembers([]);
              setRoomPreferences([]);
              setAdvancePaidInput('');
              setSelectedTourId('');
              setMainPassengerType('adult');
              setDocumentNames({ aadhaarFileName: '', panFileName: '' });
              setAdditionalDocuments([]);
              setFormError('');
              setShowForm(!showForm);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

      {/* Create Booking Form */}
      {showForm && (
        <Card>
          <CardContent>
            <form key={editingBooking?.id ?? 'new'} onSubmit={handleSaveBooking} className="space-y-6">
              {/* Basic Information Section */}
              <div className="pt-4">
                <h3 className="text-2xl font-bold mb-4 text-gray-950">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      name="firstName"
                      placeholder="Traveler's first name"
                      defaultValue={editingName.firstName}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      name="lastName"
                      placeholder="Traveler's last name"
                      defaultValue={editingName.lastName}
                    />
                  </div>
                  <div>
                    <Label>Passenger Type *</Label>
                    <Select
                      value={mainPassengerType}
                      onChange={(event) => setMainPassengerType(event.target.value)}
                      required
                    >
                      {PASSENGER_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      name="phone"
                      placeholder="10-digit mobile number"
                      defaultValue={editingBooking?.phone ?? ''}
                      required
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select name="gender" defaultValue={editingBooking?.gender ?? ''}>
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      defaultValue={editingBooking?.dateOfBirth?.slice(0, 10) ?? ''}
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      name="address"
                      placeholder="Full address"
                      defaultValue={editingBooking?.address ?? ''}
                    />
                  </div>
                  <div>
                    <Label>Aadhaar Card *</Label>
                    <Input name="aadhaar" type="file" required={!documentNames.aadhaarFileName} />
                    {documentNames.aadhaarFileName ? (
                      <p className="mt-1 text-xs text-gray-500">{documentNames.aadhaarFileName}</p>
                    ) : null}
                  </div>
                  <div>
                    <Label>PAN Card *</Label>
                    <Input name="pan" type="file" required={!documentNames.panFileName} />
                    {documentNames.panFileName ? (
                      <p className="mt-1 text-xs text-gray-500">{documentNames.panFileName}</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  <Button type="button" variant="outline" onClick={addAdditionalDocument}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                </div>
                {additionalDocuments.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {additionalDocuments.map((document, index) => (
                      <div key={document.id} className="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-3">
                        <div>
                          <Label>Document Type *</Label>
                          <Select
                            value={document.type}
                            onChange={(event) =>
                              updateAdditionalDocument(document.id, 'type', event.target.value)
                            }
                            required
                          >
                            <option value="">Select type</option>
                            {ADDITIONAL_DOCUMENT_TYPES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label>Document File *</Label>
                          <Input
                            name={`document-${document.id}`}
                            type="file"
                            required={!document.fileName}
                            onChange={(event) =>
                              event.target.files?.[0]?.name
                                ? updateAdditionalDocument(
                                    document.id,
                                    'fileName',
                                    event.target.files[0].name
                                  )
                                : undefined
                            }
                          />
                          {document.fileName ? (
                            <p className="mt-1 text-xs text-gray-500">{document.fileName}</p>
                          ) : null}
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeAdditionalDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="ml-2">Remove {index + 1}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-950">Family / Group Members</h3>
                  <div className="mt-3">
                    <Button type="button" variant="outline" onClick={addFamilyMember}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  </div>
                </div>

                {familyMembers.length > 0 && (
                  <div className="space-y-4">
                    {familyMembers.map((member, index) => (
                      <div key={member.id} className="rounded-md border p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="font-medium">Member {index + 1}</h4>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFamilyMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <Label>First Name *</Label>
                            <Input
                              value={member.firstName}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'firstName', event.target.value)
                              }
                              placeholder="Passenger first name"
                              required
                            />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input
                              value={member.lastName}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'lastName', event.target.value)
                              }
                              placeholder="Passenger last name"
                            />
                          </div>
                          <div>
                            <Label>Relation</Label>
                            <Input
                              value={member.relation}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'relation', event.target.value)
                              }
                              placeholder="Spouse / Child / Parent"
                            />
                          </div>
                          <div>
                            <Label>Passenger Type *</Label>
                            <Select
                              value={member.passengerType}
                              onChange={(event) =>
                                updateFamilyMember(
                                  member.id,
                                  'passengerType',
                                  event.target.value
                                )
                              }
                              required
                            >
                              {PASSENGER_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label>Gender</Label>
                            <Select
                              value={member.gender}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'gender', event.target.value)
                              }
                            >
                              <option value="">Select gender</option>
                              {GENDER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label>Date of Birth</Label>
                            <Input
                              type="date"
                              value={member.dateOfBirth}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'dateOfBirth', event.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={member.phone}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'phone', event.target.value)
                              }
                              placeholder="Family member phone"
                              required
                            />
                          </div>
                          <div>
                            <Label>Aadhaar Card *</Label>
                            <Input
                              name={`family-${member.id}-aadhaar`}
                              type="file"
                              required={!member.aadhaarFileName}
                              onChange={(event) =>
                                event.target.files?.[0]?.name
                                  ? updateFamilyMember(
                                      member.id,
                                      'aadhaarFileName',
                                      event.target.files[0].name
                                    )
                                  : undefined
                              }
                            />
                            {member.aadhaarFileName ? (
                              <p className="mt-1 text-xs text-gray-500">{member.aadhaarFileName}</p>
                            ) : null}
                          </div>
                          <div>
                            <Label>PAN Card *</Label>
                            <Input
                              name={`family-${member.id}-pan`}
                              type="file"
                              required={!member.panFileName}
                              onChange={(event) =>
                                event.target.files?.[0]?.name
                                  ? updateFamilyMember(
                                      member.id,
                                      'panFileName',
                                      event.target.files[0].name
                                    )
                                  : undefined
                              }
                            />
                            {member.panFileName ? (
                              <p className="mt-1 text-xs text-gray-500">{member.panFileName}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addFamilyAdditionalDocument(member.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Document
                          </Button>
                        </div>
                        {member.additionalDocuments.length > 0 && (
                          <div className="mt-4 space-y-4">
                            {member.additionalDocuments.map((document, documentIndex) => (
                              <div
                                key={document.id}
                                className="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-3"
                              >
                                <div>
                                  <Label>Document Type *</Label>
                                  <Select
                                    value={document.type}
                                    onChange={(event) =>
                                      updateFamilyAdditionalDocument(
                                        member.id,
                                        document.id,
                                        'type',
                                        event.target.value
                                      )
                                    }
                                    required
                                  >
                                    <option value="">Select type</option>
                                    {ADDITIONAL_DOCUMENT_TYPES.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div>
                                  <Label>Document File *</Label>
                                  <Input
                                    name={`family-${member.id}-document-${document.id}`}
                                    type="file"
                                    required={!document.fileName}
                                    onChange={(event) =>
                                      event.target.files?.[0]?.name
                                        ? updateFamilyAdditionalDocument(
                                            member.id,
                                            document.id,
                                            'fileName',
                                            event.target.files[0].name
                                          )
                                        : undefined
                                    }
                                  />
                                  {document.fileName ? (
                                    <p className="mt-1 text-xs text-gray-500">
                                      {document.fileName}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      removeFamilyAdditionalDocument(member.id, document.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                    <span className="ml-2">Remove {documentIndex + 1}</span>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-950">Rooms</h3>
                  <div className="mt-3">
                    <Button type="button" variant="outline" onClick={addRoomPreference}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Room
                    </Button>
                  </div>
                </div>

                {roomPreferences.length > 0 && (
                  <div className="space-y-4">
                    {roomPreferences.map((room, index) => (
                      <div key={room.id} className="rounded-md border p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="font-medium">Room {index + 1}</h4>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRoomPreference(room.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label>Preference Type</Label>
                            <Select
                              value={room.preferenceType}
                              onChange={(event) =>
                                updateRoomPreference(room.id, 'preferenceType', event.target.value)
                              }
                            >
                              <option value="">Select option</option>
                              {ROOM_SHARING_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Travel Information Section */}
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-950">Travel Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Tour Batch *</Label>
                    <Select
                      name="tourId"
                      value={selectedTourId}
                      onChange={(event) => setSelectedTourId(event.target.value)}
                      required
                    >
                      <option value="">Choose tour</option>
                      {tours.map((tour) => (
                        <option key={tour.id} value={tour.id}>
                          {tour.tourName}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Pickup Point</Label>
                    <Input
                      name="pickupPoint"
                      placeholder="e.g., Delhi Airport"
                      defaultValue={editingBooking?.pickupPoint ?? ''}
                    />
                  </div>
                </div>
              </div>

              {(
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-950">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Adults</Label>
                      <Input
                        type="number"
                        value={adultCount}
                        readOnly
                        className="font-semibold text-black"
                      />
                    </div>
                    <div>
                      <Label>Children</Label>
                      <Input
                        type="number"
                        value={childCount}
                        readOnly
                        className="font-semibold text-black"
                      />
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <Input
                        type="number"
                        value={calculatedTotalAmount}
                        readOnly
                        className="font-semibold text-black"
                      />
                      <input type="hidden" name="totalAmount" value={calculatedTotalAmount} />
                    </div>
                    <div>
                      <Label>Balance Amount</Label>
                      <Input
                        type="number"
                        value={calculatedBalance}
                        placeholder="Auto-calculated"
                        readOnly
                        className="font-semibold text-black"
                      />
                    </div>
                    <div>
                      <Label>Advance Paid *</Label>
                      <Input
                        name="advancePaid"
                        type="number"
                        placeholder="Advance amount"
                        value={advancePaidInput}
                        onChange={(event) => setAdvancePaidInput(event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Payment Date</Label>
                      <Input
                        name="paymentDate"
                        type="date"
                        defaultValue={editingBooking?.paymentDate?.slice(0, 10) ?? ''}
                      />
                    </div>
                    <div>
                      <Label>Payment Due Date</Label>
                      <Input
                        name="dueDate"
                        type="date"
                        defaultValue={editingBooking?.dueDate?.slice(0, 10) ?? ''}
                        required
                      />
                    </div>
                    <div>
                      <Label>Payment Mode</Label>
                      <Select name="paymentMode" defaultValue={editingBooking?.paymentMode ?? ''}>
                        <option value="">Select mode</option>
                        {PAYMENT_MODES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Transaction ID</Label>
                      <Input
                        name="transactionId"
                        placeholder="Reference/Transaction ID"
                        defaultValue={editingBooking?.transactionId ?? ''}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Operations Fields */}
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-950">Operations Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>PNR</Label>
                    <Input
                      name="pnr"
                      placeholder="Flight PNR"
                      defaultValue={editingBooking?.pnr ?? ''}
                    />
                  </div>
                  <div>
                    <Label>Flight Status</Label>
                    <Select name="flightStatus" defaultValue={editingBooking?.flightStatus ?? ''}>
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Visa Status</Label>
                    <Select name="visaStatus" defaultValue={editingBooking?.visaStatus ?? ''}>
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Hotel Status</Label>
                    <Select name="hotelStatus" defaultValue={editingBooking?.hotelStatus ?? ''}>
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-950">Booking Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Booked By</Label>
                    <Input
                      name="bookedBy"
                      placeholder="Person or staff name"
                      defaultValue={editingBooking?.bookedBy ?? ''}
                    />
                  </div>
                  <div>
                    <Label>Booking Status</Label>
                    <Select name="status" defaultValue={editingBooking?.status ?? 'confirmed'}>
                      {BOOKING_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingBooking ? 'Update Booking' : 'Create Booking'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {viewingBooking && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{viewingBooking.travelerName}</CardTitle>
                <CardDescription>{viewingBooking.bookingCode}</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={() => setViewingBooking(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Tour</p>
                <p className="font-medium">{viewingBooking.tour}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{viewingBooking.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booked By</p>
                <p className="font-medium">{viewingBooking.bookedBy || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment</p>
                <p className="font-medium">
                  {formatCurrency(viewingBooking.advancePaid)} paid,{' '}
                  {formatCurrency(viewingBooking.balance)} balance
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Date</p>
                <p className="font-medium">
                  {viewingBooking.paymentDate
                    ? viewingBooking.paymentDate.slice(0, 10)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Preferences</p>
                <p className="font-medium">{viewingBooking.roomSharing || '-'}</p>
              </div>
            </div>

            {viewingBooking.members.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-semibold">Family / Group Members</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingBooking.members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.serialNumber ?? '-'}</TableCell>
                          <TableCell>{member.fullName}</TableCell>
                          <TableCell>{member.relation || '-'}</TableCell>
                          <TableCell>{member.gender || '-'}</TableCell>
                          <TableCell>{member.phone || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
            <Input
              placeholder="Search by name, booking code, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-9 w-full rounded-full sm:w-72 ${
                searchQuery
                  ? 'border-blue-600 bg-blue-50 text-blue-900 focus:ring-blue-600'
                  : ''
              }`}
            />
            <Select
              value={tourFilter}
              onChange={(event) => setTourFilter(event.target.value)}
              className={filterSelectClassName(Boolean(tourFilter))}
            >
              <option value="">Tours</option>
              {filterOptions.tours.map((tourName) => (
                <option key={tourName} value={tourName}>
                  {tourName}
                </option>
              ))}
            </Select>
            <Select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className={filterSelectClassName(Boolean(paymentFilter))}
            >
              <option value="">Payments</option>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={filterSelectClassName(Boolean(statusFilter))}
            >
              <option value="">Booking Status</option>
              {BOOKING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {(searchQuery || tourFilter || paymentFilter || statusFilter) ? (
              <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setTourFilter('');
                setPaymentFilter('');
                setStatusFilter('');
              }}
              className="h-9 rounded-full"
            >
              Clear filters
            </Button>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Code</TableHead>
                  <TableHead>Traveler Name</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                    <TableCell>{booking.travelerName}</TableCell>
                    <TableCell>{1 + (booking.memberCount ?? 0)}</TableCell>
                    <TableCell className="text-sm">{booking.tour}</TableCell>
                    <TableCell className="text-sm">{booking.phone}</TableCell>
                    <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(booking.advancePaid)}</TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatCurrency(booking.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                        {formatStatusLabel(normalizePaymentStatus(booking.paymentStatus))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          title="View"
                          onClick={() => setViewingBooking(booking)}
                        >
                          <Eye size={16} />
                          <span className="ml-2">View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit"
                          onClick={() => startEditingBooking(booking)}
                        >
                          <Edit2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}
