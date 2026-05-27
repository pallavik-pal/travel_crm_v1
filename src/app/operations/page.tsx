'use client';

import React, { type FormEvent, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
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
    rooms: [
      {
        roomNumber: '101',
        capacity: 2,
        occupants: ['Rajesh Kumar', 'Priya Singh'],
      },
    ],
  },
];

export default function OperationsPage() {
  const [tours, setTours] = useRecords('/api/operations', mockTours);
  const [selectedTourId, setSelectedTourId] = useState(String(mockTours[0].id));
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const selectedTour =
    tours.find((tour) => String(tour.id) === selectedTourId) ?? tours[0] ?? mockTours[0];

  const handleAddRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const form = event.currentTarget;
    const payload = {
      tourId: selectedTour.id,
      ...Object.fromEntries(new FormData(form).entries()),
    };

    try {
      const response = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to add room');
      }

      setTours(data);
      form.reset();
      setShowRoomForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to add room');
    } finally {
      setIsSaving(false);
    }
  };

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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Room Allocation</CardTitle>
              <Button onClick={() => setShowRoomForm(!showRoomForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {showRoomForm && (
              <form onSubmit={handleAddRoom} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Input name="roomNumber" placeholder="Room Number" required />
                <Input name="capacity" type="number" min="1" placeholder="Capacity" required />
                <Input name="occupants" placeholder="Occupants, comma separated" required />
                {formError && <p className="md:col-span-3 text-sm text-red-600">{formError}</p>}
                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Room'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRoomForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedTour.rooms.map((room, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold">Room {room.roomNumber}</h4>
                    <p>Capacity: {room.capacity}</p>
                    {room.occupants.map((occupant, idx) => (
                      <p key={idx}>- {occupant}</p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

