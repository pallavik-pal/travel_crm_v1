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
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useRecords } from '@/lib/use-records';
import { Archive, Edit2, Eye, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const mockTours = [
  {
    id: '1',
    tourName: 'Thailand May Batch',
    tourCode: 'TR-202505-A1',
    destination: 'Bangkok, Phuket',
    departureDate: '2026-05-30',
    returnDate: '2026-06-06',
    totalSeats: 40,
    occupiedSeats: 35,
    packagePrice: 45000,
    pickupCity: 'Delhi',
    tourManager: 'Rajesh Kumar',
    status: 'active',
  },
  {
    id: '2',
    tourName: 'Kashmir June Batch',
    tourCode: 'TR-202506-B1',
    destination: 'Srinagar, Gulmarg',
    departureDate: '2026-06-15',
    returnDate: '2026-06-22',
    totalSeats: 30,
    occupiedSeats: 12,
    packagePrice: 35000,
    pickupCity: 'Delhi',
    tourManager: 'Priya Singh',
    status: 'draft',
  },
  {
    id: '3',
    tourName: 'Dubai July Batch',
    tourCode: 'TR-202507-C1',
    destination: 'Dubai, Abu Dhabi',
    departureDate: '2026-07-10',
    returnDate: '2026-07-17',
    totalSeats: 20,
    occupiedSeats: 8,
    packagePrice: 55000,
    pickupCity: 'Mumbai',
    tourManager: 'Amit Patel',
    status: 'draft',
  },
];

export default function ToursPage() {
  const [tours, setTours] = useRecords('/api/tours', mockTours);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreateTour = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to create tour');
      }

      setTours((currentTours) => [data, ...currentTours]);
      event.currentTarget.reset();
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create tour');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTours = tours.filter(
    (tour) =>
      tour.tourName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.tourCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const occupancyPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100);
  };

  const totalOccupancy =
    tours.length > 0
      ? Math.round(
          (tours.reduce((acc, t) => acc + t.occupiedSeats, 0) /
            tours.reduce((acc, t) => acc + t.totalSeats, 0)) *
            100
        )
      : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tours</h1>
            <p className="text-gray-600 mt-1">Manage group tour batches</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tour
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Tour</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTour} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tour Name</Label>
                  <Input name="tourName" placeholder="e.g., Thailand May Batch" required />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input name="destination" placeholder="e.g., Bangkok, Phuket" required />
                </div>
                <div>
                  <Label>Departure Date</Label>
                  <Input name="departureDate" type="date" required />
                </div>
                <div>
                  <Label>Return Date</Label>
                  <Input name="returnDate" type="date" required />
                </div>
                <div>
                  <Label>Total Seats</Label>
                  <Input name="totalSeats" type="number" min="1" placeholder="40" required />
                </div>
                <div>
                  <Label>Package Price (INR)</Label>
                  <Input name="packagePrice" type="number" min="0" placeholder="45000" required />
                </div>
                <div>
                  <Label>Pickup City</Label>
                  <Input name="pickupCity" placeholder="Delhi" required />
                </div>
                <div>
                  <Label>Tour Manager</Label>
                  <Input name="tourManager" placeholder="Manager name" required />
                </div>
                {formError && (
                  <p className="md:col-span-2 text-sm text-red-600">{formError}</p>
                )}
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Create Tour'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Input
          placeholder="Search by tour name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        <Card>
          <CardHeader>
            <CardTitle>Tour Batches</CardTitle>
            <CardDescription>
              {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tour Name</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTours.map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tour.tourName}</p>
                          <p className="text-sm text-gray-600">{tour.tourCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>{tour.destination}</TableCell>
                      <TableCell>{formatDate(tour.departureDate)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {tour.occupiedSeats}/{tour.totalSeats}
                          </p>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${occupancyPercentage(
                                  tour.occupiedSeats,
                                  tour.totalSeats
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(tour.packagePrice)}</TableCell>
                      <TableCell>{tour.tourManager}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tour.status)}>
                          {tour.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye size={16} />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit2 size={16} />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Archive size={16} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Total Tours</p>
              <p className="text-3xl font-bold">{tours.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Active Tours</p>
              <p className="text-3xl font-bold">
                {tours.filter((t) => t.status === 'active').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Total Occupancy</p>
              <p className="text-3xl font-bold">{totalOccupancy}%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
