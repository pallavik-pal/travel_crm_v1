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
import { type FormEvent, useState } from 'react';

type BookingMemberRecord = {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  relation: string;
  aadhaarFileName?: string;
  panFileName?: string;
  passportFileName?: string;
};

type BookingRecord = {
  id: string;
  bookingCode: string;
  travelerName: string;
  tour: string;
  phone: string;
  email: string;
  memberCount: number;
  members: BookingMemberRecord[];
  seat: string;
  roomSharing: string;
  totalAmount: number;
  advancePaid: number;
  balance: number;
  paymentStatus: string;
  status: string;
};

const mockBookings: BookingRecord[] = [
  {
    id: '1',
    bookingCode: 'BK-202505-ABC123',
    travelerName: 'Rajesh Kumar',
    tour: 'Thailand May Batch',
    phone: '9876543210',
    email: 'rajesh@email.com',
    memberCount: 0,
    members: [],
    seat: 'A-01',
    roomSharing: 'double',
    totalAmount: 45000,
    advancePaid: 35000,
    balance: 10000,
    paymentStatus: 'partial',
    status: 'confirmed',
  },
  {
    id: '2',
    bookingCode: 'BK-202505-DEF456',
    travelerName: 'Priya Singh',
    tour: 'Thailand May Batch',
    phone: '9876543211',
    email: 'priya@email.com',
    memberCount: 0,
    members: [],
    seat: 'A-02',
    roomSharing: 'single',
    totalAmount: 45000,
    advancePaid: 45000,
    balance: 0,
    paymentStatus: 'paid',
    status: 'confirmed',
  },
  {
    id: '3',
    bookingCode: 'BK-202505-GHI789',
    travelerName: 'Amit Patel',
    tour: 'Kashmir June Batch',
    phone: '9876543212',
    email: 'amit@email.com',
    memberCount: 0,
    members: [],
    seat: 'B-01',
    roomSharing: 'triple',
    totalAmount: 35000,
    advancePaid: 15000,
    balance: 20000,
    paymentStatus: 'pending',
    status: 'confirmed',
  },
];

type FamilyMemberForm = {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  relation: string;
  aadhaarFileName: string;
  panFileName: string;
  passportFileName: string;
};

type RoomPreferenceForm = {
  id: string;
  preferenceType: string;
};

const mockTours = [
  { id: 'thailand', tourName: 'Thailand May Batch' },
  { id: 'kashmir', tourName: 'Kashmir June Batch' },
  { id: 'dubai', tourName: 'Dubai July Batch' },
];

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

export default function BookingsPage() {
  const [bookings, setBookings] = useRecords('/api/bookings', mockBookings);
  const [tours] = useRecords('/api/tours', mockTours);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([]);
  const [roomPreferences, setRoomPreferences] = useState<RoomPreferenceForm[]>([]);
  const [advancePaidInput, setAdvancePaidInput] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [adultPrice, setAdultPrice] = useState('');
  const [childPrice, setChildPrice] = useState('');
  const [discountPerPerson, setDiscountPerPerson] = useState('');

  const totalPassengersForPrice = adultCount + childCount;
  const grossAmount =
    adultCount * Number(adultPrice || 0) + childCount * Number(childPrice || 0);
  const discountAmount = totalPassengersForPrice * Number(discountPerPerson || 0);
  const calculatedTotalAmount = Math.max(grossAmount - discountAmount, 0);

  const calculatedBalance = Math.max(
    calculatedTotalAmount - Number(advancePaidInput || 0),
    0
  );

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

    const payload = {
      ...Object.fromEntries(formData.entries()),
      id: editingBooking?.id,
      familyMembers,
      roomPreferences,
      totalAmount: calculatedTotalAmount,
      aadhaarFileName: fileName('aadhaar'),
      panFileName: fileName('pan'),
      passportFileName: fileName('passport'),
    };

    try {
      const response = await fetch('/api/bookings', {
        method: editingBooking ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to create booking');
      }

      setBookings((currentBookings) =>
        editingBooking
          ? currentBookings.map((booking) => (booking.id === data.id ? data : booking))
          : [data, ...currentBookings]
      );
      form.reset();
      setEditingBooking(null);
      setFamilyMembers([]);
      setRoomPreferences([]);
      setAdvancePaidInput('');
      setAdultCount(1);
      setChildCount(0);
      setAdultPrice('');
      setChildPrice('');
      setDiscountPerPerson('');
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
        fullName: member.fullName,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : '',
        phone: member.phone,
        email: member.email,
        relation: member.relation,
        aadhaarFileName: member.aadhaarFileName ?? '',
        panFileName: member.panFileName ?? '',
        passportFileName: member.passportFileName ?? '',
      }))
    );
    setRoomPreferences(parseRoomPreferences(booking.roomSharing));
    setAdvancePaidInput(String(booking.advancePaid ?? ''));
    setAdultCount(1);
    setChildCount(0);
    setAdultPrice(String(booking.totalAmount ?? ''));
    setChildPrice('');
    setDiscountPerPerson('');
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setEditingBooking(null);
    setFamilyMembers([]);
    setRoomPreferences([]);
    setAdvancePaidInput('');
    setAdultCount(1);
    setChildCount(0);
    setAdultPrice('');
    setChildPrice('');
    setDiscountPerPerson('');
    setFormError('');
    setShowForm(false);
  };

  const addFamilyMember = () => {
    setFamilyMembers((currentMembers) => [
      ...currentMembers,
      {
        id: crypto.randomUUID(),
        fullName: '',
        gender: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        relation: '',
        aadhaarFileName: '',
        panFileName: '',
        passportFileName: '',
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
    value: string
  ) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== id)
    );
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.travelerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
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
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

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
              setAdultCount(1);
              setChildCount(0);
              setAdultPrice('');
              setChildPrice('');
              setDiscountPerPerson('');
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
                    <Label>Full Name *</Label>
                    <Input
                      name="fullName"
                      placeholder="Traveler's full name"
                      defaultValue={editingBooking?.travelerName ?? ''}
                      required
                    />
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
                    <Select name="gender">
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
                    <Input name="dateOfBirth" type="date" />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input name="address" placeholder="Full address" />
                  </div>
                  <div>
                    <Label>Aadhaar Card</Label>
                    <Input name="aadhaar" type="file" />
                  </div>
                  <div>
                    <Label>PAN Card</Label>
                    <Input name="pan" type="file" />
                  </div>
                  <div>
                    <Label>Passport</Label>
                    <Input name="passport" type="file" />
                  </div>
                </div>
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
                            <Label>Full Name *</Label>
                            <Input
                              value={member.fullName}
                              onChange={(event) =>
                                updateFamilyMember(member.id, 'fullName', event.target.value)
                              }
                              placeholder="Passenger name"
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
                            <Label>Aadhaar Card</Label>
                            <Input
                              type="file"
                              onChange={(event) =>
                                updateFamilyMember(
                                  member.id,
                                  'aadhaarFileName',
                                  event.target.files?.[0]?.name ?? ''
                                )
                              }
                            />
                            {member.aadhaarFileName ? (
                              <p className="mt-1 text-xs text-gray-500">{member.aadhaarFileName}</p>
                            ) : null}
                          </div>
                          <div>
                            <Label>PAN Card</Label>
                            <Input
                              type="file"
                              onChange={(event) =>
                                updateFamilyMember(
                                  member.id,
                                  'panFileName',
                                  event.target.files?.[0]?.name ?? ''
                                )
                              }
                            />
                            {member.panFileName ? (
                              <p className="mt-1 text-xs text-gray-500">{member.panFileName}</p>
                            ) : null}
                          </div>
                          <div>
                            <Label>Passport</Label>
                            <Input
                              type="file"
                              onChange={(event) =>
                                updateFamilyMember(
                                  member.id,
                                  'passportFileName',
                                  event.target.files?.[0]?.name ?? ''
                                )
                              }
                            />
                            {member.passportFileName ? (
                              <p className="mt-1 text-xs text-gray-500">
                                {member.passportFileName}
                              </p>
                            ) : null}
                          </div>
                        </div>
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
                      defaultValue={tours.find((tour) => tour.tourName === editingBooking?.tour)?.id ?? ''}
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
                    <Input name="pickupPoint" placeholder="e.g., Delhi Airport" />
                  </div>
                </div>
              </div>

              {!editingBooking && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-950">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Adults</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={adultCount}
                          onChange={(event) => setAdultCount(Number(event.target.value || 0))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAdultCount((count) => count + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Price Per Adult</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Adult price"
                        value={adultPrice}
                        onChange={(event) => setAdultPrice(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Children</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={childCount}
                          onChange={(event) => setChildCount(Number(event.target.value || 0))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setChildCount((count) => count + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Price Per Child</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Child price"
                        value={childPrice}
                        onChange={(event) => setChildPrice(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Discount Per Person</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Discount amount"
                        value={discountPerPerson}
                        onChange={(event) => setDiscountPerPerson(event.target.value)}
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
                      <Input name="paymentDate" type="date" />
                    </div>
                    <div>
                      <Label>Payment Due Date</Label>
                      <Input name="dueDate" type="date" required />
                    </div>
                    <div>
                      <Label>Payment Mode</Label>
                      <Select name="paymentMode">
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
                      <Input name="transactionId" placeholder="Reference/Transaction ID" />
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
                    <Input name="pnr" placeholder="Flight PNR" />
                  </div>
                  <div>
                    <Label>Flight Status</Label>
                    <Select name="flightStatus">
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Visa Status</Label>
                    <Select name="visaStatus">
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Hotel Status</Label>
                    <Select name="hotelStatus">
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
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

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, booking code, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" title="View">
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit"
                          onClick={() => startEditingBooking(booking)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" title="Delete">
                          <Trash2 size={16} className="text-red-600" />
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
