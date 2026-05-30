'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const mockTours = [
  {
    id: '1',
    name: 'Thailand May Batch',
    departure: '2026-05-30',
    travelers: [
      {
        id: '1',
        name: 'Rajesh Kumar',
        pnr: 'AB123456',
        flightStatus: 'confirmed',
        visaStatus: 'approved',
        hotelStatus: 'confirmed',
        ticketIssued: true,
      },
      {
        id: '2',
        name: 'Priya Singh',
        pnr: 'AB123457',
        flightStatus: 'pending',
        visaStatus: 'pending',
        hotelStatus: 'confirmed',
        ticketIssued: false,
      },
    ],
  },
];

const emptyTour: (typeof mockTours)[number] = {
  id: '',
  name: '',
  departure: '',
  travelers: [],
};

export default function OperationsPage() {
  const [tours] = useRecords('/api/operations', [] as typeof mockTours);
  const [selectedTourId, setSelectedTourId] = useState('');
  const selectedTour =
    tours.find((tour) => String(tour.id) === selectedTourId) ?? tours[0] ?? emptyTour;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingHotels = selectedTour.travelers.filter(
    (t) => t.hotelStatus === 'pending'
  );

  const pendingTickets = selectedTour.travelers.filter(
    (t) => !t.ticketIssued
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-gray-600">Manage tour logistics</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Tour</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedTour.id}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.name} - {formatDate(tour.departure)}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p>Total Travelers</p>
              <p className="text-2xl font-bold">
                {selectedTour.travelers.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p>Tickets Issued</p>
              <p className="text-2xl font-bold">
                {
                  selectedTour.travelers.filter((t) => t.ticketIssued).length
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p>Pending Hotels</p>
              <p className="text-2xl font-bold">{pendingHotels.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p>Pending Tickets</p>
              <p className="text-2xl font-bold">{pendingTickets.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Passenger List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>PNR</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Visa</TableHead>
                  <TableHead>Hotel</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {selectedTour.travelers.map((traveler) => (
                  <TableRow key={traveler.id}>
                    <TableCell>{traveler.name}</TableCell>
                    <TableCell>{traveler.pnr}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(traveler.flightStatus)}>
                        {traveler.flightStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(traveler.visaStatus)}>
                        {traveler.visaStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(traveler.hotelStatus)}>
                        {traveler.hotelStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}
