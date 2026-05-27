import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/constants';
import { getTourDetails } from '@/lib/records';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const getAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) {
    return '-';
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};

const formatRoomPreferences = (value: string) => {
  if (!value) {
    return 'Not set';
  }

  try {
    const rooms = JSON.parse(value) as { roomNumber?: string; preferenceType?: string }[];

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return value;
    }

    return rooms
      .map((room) => [room.roomNumber, room.preferenceType].filter(Boolean).join(': '))
      .join(', ');
  } catch {
    return value;
  }
};

export default async function TourDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await getTourDetails(id);

  if (!tour) {
    notFound();
  }

  const collectionPercent =
    tour.bookings.length > 0
      ? Math.round(
          (tour.bookings.reduce((sum, booking) => sum + booking.payment.advancePaid, 0) /
            tour.bookings.reduce((sum, booking) => sum + booking.payment.totalAmount, 0)) *
            100
        )
      : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{tour.tourName}</h1>
              <Badge>{tour.status}</Badge>
            </div>
            <p className="mt-1 text-gray-600">
              {tour.tourCode} · {tour.destination}
            </p>
          </div>
          <Badge variant="secondary">
            {tour.occupiedSeats}/{tour.totalSeats} seats booked
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Departure</p>
                <p className="font-semibold">{formatDate(tour.departureDate)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Pickup City</p>
                <p className="font-semibold">{tour.pickupCity}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="font-semibold">{tour.bookings.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Collection</p>
              <p className="text-2xl font-bold">{collectionPercent}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booked Customers</CardTitle>
            <CardDescription>
              Customer and payment details for this tour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Room Preferences</TableHead>
                  <TableHead>Contact No</TableHead>
                  <TableHead>Advance Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Advance Date</TableHead>
                  <TableHead>Booked By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tour.bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-600">
                      No customers have booked this tour yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  tour.bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{booking.traveler.serialNumber}</p>
                          {booking.members.map((member) => (
                            <p key={member.id} className="text-sm text-gray-600">
                              {member.serialNumber ?? '-'}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{booking.traveler.fullName}</p>
                          {booking.members.map((member) => (
                            <p key={member.id} className="text-sm text-gray-600">
                              {member.fullName}
                              {member.relation ? ` (${member.relation})` : ''}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{booking.traveler.gender || '-'}</p>
                          {booking.members.map((member) => (
                            <p key={member.id} className="text-sm text-gray-600">
                              {member.gender || '-'}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{getAge(booking.traveler.dateOfBirth)}</p>
                          {booking.members.map((member) => (
                            <p key={member.id} className="text-sm text-gray-600">
                              {getAge(member.dateOfBirth)}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatRoomPreferences(booking.roomSharingPreference)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{booking.traveler.phone}</p>
                          {booking.members.map((member) => (
                            <p key={member.id} className="text-sm text-gray-600">
                              {member.phone || '-'}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(booking.payment.advancePaid)}</TableCell>
                      <TableCell>{formatCurrency(booking.payment.balanceAmount)}</TableCell>
                      <TableCell>
                        {booking.payment.paymentDate ? formatDate(booking.payment.paymentDate) : '-'}
                      </TableCell>
                      <TableCell>{booking.bookedBy || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
