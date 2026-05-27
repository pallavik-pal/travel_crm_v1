import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/constants';
import { getTourDetails } from '@/lib/records';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
              Customer, booking, payment, document, and operations details for this tour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Seat / Room</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tour.bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-600">
                      No customers have booked this tour yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  tour.bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{booking.traveler.fullName}</p>
                          <p className="text-sm text-gray-600">{booking.traveler.phone}</p>
                          {booking.traveler.email && (
                            <p className="text-sm text-gray-600">{booking.traveler.email}</p>
                          )}
                          {booking.members.length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs font-semibold uppercase text-gray-500">
                                Family / Group
                              </p>
                              <div className="mt-1 space-y-1">
                                {booking.members.map((member) => (
                                  <p key={member.id} className="text-sm text-gray-700">
                                    {member.fullName}
                                    {member.relation ? ` (${member.relation})` : ''}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{booking.bookingCode}</p>
                          <Badge variant="secondary">{booking.status}</Badge>
                          <p className="text-sm text-gray-600">{formatDate(booking.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>Seat: {booking.seatNumber || 'Not assigned'}</p>
                          <p>Room: {booking.roomSharingPreference || 'Not set'}</p>
                          <p>Pickup: {booking.pickupPoint || 'Not set'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge>{booking.payment.status}</Badge>
                          <p className="text-sm">{formatCurrency(booking.payment.advancePaid)} paid</p>
                          <p className="text-sm text-orange-600">
                            {formatCurrency(booking.payment.balanceAmount)} balance
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {booking.documents.length === 0 ? (
                            <Badge variant="secondary">None</Badge>
                          ) : (
                            booking.documents.map((document) => (
                              <Badge key={document.id} variant="secondary">
                                {document.type}: {document.status}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>PNR: {booking.operations.pnr || 'Not set'}</p>
                          <p>Flight: {booking.operations.flightStatus}</p>
                          <p>Visa: {booking.operations.visaStatus}</p>
                          <p>Hotel: {booking.operations.hotelStatus}</p>
                        </div>
                      </TableCell>
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
