'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/constants';
import { useRecords } from '@/lib/use-records';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';

const mockTravelers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh@email.com',
    phone: '9876543210',
    tour: 'Thailand May Batch',
    bookingDate: '2026-04-15',
    gender: 'Male',
    dob: '1985-06-20',
    documents: {
      aadhaar: true,
      pan: true,
      passport: true,
    },
    paymentStatus: 'partial',
    totalBookings: 2,
  },
  {
    id: 2,
    name: 'Priya Singh',
    email: 'priya@email.com',
    phone: '9876543211',
    tour: 'Thailand May Batch',
    bookingDate: '2026-04-16',
    gender: 'Female',
    dob: '1990-03-15',
    documents: {
      aadhaar: true,
      pan: true,
      passport: true,
    },
    paymentStatus: 'paid',
    totalBookings: 1,
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit@email.com',
    phone: '9876543212',
    tour: 'Kashmir June Batch',
    bookingDate: '2026-04-17',
    gender: 'Male',
    paymentStatus: 'pending',
    totalBookings: 1,
    documents: {
      aadhaar: true,
      pan: false,
      passport: false,
    },
  },
  {
    id: 4,
    name: 'Ananya Sharma',
    email: 'ananya@email.com',
    phone: '9876543213',
    tour: 'Dubai July Batch',
    bookingDate: '2026-04-18',
    gender: 'Female',
    paymentStatus: 'paid',
    totalBookings: 1,
    documents: {
      aadhaar: true,
      pan: true,
      passport: true,
    },
  },
];

export default function TravelersPage() {
  const [travelers] = useRecords('/api/travelers', mockTravelers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTour, setFilterTour] = useState('');

  let filteredTravelers = travelers.filter(
    (traveler) =>
      traveler.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      traveler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      traveler.phone.includes(searchQuery)
  );

  if (filterTour) {
    filteredTravelers = filteredTravelers.filter((t) => t.tour === filterTour);
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDocumentStatus = (docs: Record<string, boolean>) => {
    const total = Object.keys(docs).length;
    const uploaded = Object.values(docs).filter(Boolean).length;

    if (uploaded === total) {
      return { status: 'Complete', variant: 'default' as const };
    }

    if (uploaded === 0) {
      return { status: 'None', variant: 'destructive' as const };
    }

    return { status: `${uploaded}/${total}`, variant: 'secondary' as const };
  };

  const tours = [...new Set(travelers.map((t) => t.tour))];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travelers</h1>
          <p className="text-gray-600 mt-1">
            Central traveler database and management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Total Travelers</p>
              <p className="text-3xl font-bold mt-2">{travelers.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Payment Completed</p>
              <p className="text-3xl font-bold mt-2">
                {travelers.filter((t) => t.paymentStatus === 'paid').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Docs Complete</p>
              <p className="text-3xl font-bold mt-2">
                {
                  travelers.filter((t) =>
                    Object.values(t.documents).every(Boolean)
                  ).length
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Pending Docs</p>
              <p className="text-3xl font-bold mt-2">
                {
                  travelers.filter(
                    (t) => !Object.values(t.documents).every(Boolean)
                  ).length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          <select
            value={filterTour}
            onChange={(e) => setFilterTour(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Tours</option>
            {tours.map((tour) => (
              <option key={tour} value={tour}>
                {tour}
              </option>
            ))}
          </select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Travelers List</CardTitle>
            <CardDescription>
              {filteredTravelers.length} traveler
              {filteredTravelers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredTravelers.map((traveler) => {
                    const docStatus = getDocumentStatus(traveler.documents);

                    return (
                      <TableRow key={traveler.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{traveler.name}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(traveler.bookingDate)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <p>{traveler.email}</p>
                            <p className="text-gray-600">{traveler.phone}</p>
                          </div>
                        </TableCell>

                        <TableCell>{traveler.tour}</TableCell>
                        <TableCell>{traveler.gender}</TableCell>

                        <TableCell>
                          <Badge variant={docStatus.variant}>
                            {docStatus.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={getPaymentStatusColor(
                              traveler.paymentStatus
                            )}
                          >
                            {traveler.paymentStatus}
                          </Badge>
                        </TableCell>

                        <TableCell>{traveler.totalBookings}</TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye size={16} />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit2 size={16} />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
