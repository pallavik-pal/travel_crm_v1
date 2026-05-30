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
import { Edit2, Eye, Plus, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

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
    childPrice: 30000,
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
    childPrice: 25000,
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
    childPrice: 40000,
    pickupCity: 'Mumbai',
    tourManager: 'Amit Patel',
    status: 'draft',
  },
];

const getAutomaticTourStatus = (returnDate: string, status: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const returnDay = new Date(returnDate);
  returnDay.setHours(0, 0, 0, 0);

  return returnDay.getTime() < today.getTime() ? 'completed' : status;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const isSelected = Boolean(value);

  return (
    <div
      className={`flex h-9 w-fit max-w-full overflow-hidden rounded-full border shadow-sm ${
        isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-auto max-w-full border-0 py-0 pl-3 pr-7 text-sm outline-none ${
          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'
        }`}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isSelected ? (
        <button
          type="button"
          onClick={onClear}
          className="flex w-8 items-center justify-center border-l border-blue-500 text-white"
          aria-label={`Clear ${label}`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export default function ToursPage() {
  const [tours, setTours] = useRecords('/api/tours', [] as typeof mockTours);
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState<(typeof mockTours)[number] | null>(null);
  const [viewingTour, setViewingTour] = useState<(typeof mockTours)[number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const displayTours = useMemo(
    () =>
      tours.map((tour) => ({
        ...tour,
        status: getAutomaticTourStatus(tour.returnDate, tour.status),
      })),
    [tours]
  );

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('action') !== 'create') {
      return;
    }

    window.setTimeout(() => {
      setEditingTour(null);
      setFormError('');
      setShowForm(true);
    }, 0);
  }, []);

  const handleSaveTour = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(editingTour ? `/api/tours/${editingTour.id}` : '/api/tours', {
        method: editingTour ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to create tour');
      }

      setTours((currentTours) =>
        editingTour
          ? currentTours.map((tour) => (tour.id === editingTour.id ? data : tour))
          : [data, ...currentTours]
      );
      form.reset();
      setEditingTour(null);
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create tour');
    } finally {
      setIsSaving(false);
    }
  };

  const filterOptions = useMemo(() => {
    const destinations = new Set<string>();

    displayTours.forEach((tour) => {
      destinations.add(tour.destination);
    });

    return {
      destinations: Array.from(destinations).sort((a, b) => a.localeCompare(b)),
    };
  }, [displayTours]);

  const filteredTours = displayTours.filter((tour) => {
    const departureDate = tour.departureDate.slice(0, 10);
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tour.tourName.toLowerCase().includes(query) ||
      tour.tourCode.toLowerCase().includes(query);
    const matchesDestination =
      !destinationFilter || tour.destination === destinationFilter;
    const matchesStartDate =
      !startDateFilter || departureDate >= startDateFilter;
    const matchesEndDate =
      !endDateFilter || departureDate <= endDateFilter;

    return (
      matchesSearch &&
      matchesDestination &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const occupancyPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100);
  };

  const totalOccupancy =
    displayTours.length > 0
      ? Math.round(
          (displayTours.reduce((acc, t) => acc + t.occupiedSeats, 0) /
            displayTours.reduce((acc, t) => acc + t.totalSeats, 0)) *
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
          <Button
            onClick={() => {
              setEditingTour(null);
              setFormError('');
              setShowForm(!showForm);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tour
          </Button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>{editingTour ? 'Edit Tour' : 'Create New Tour'}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTour(null);
                    setShowForm(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveTour} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tour Name</Label>
                  <Input
                    name="tourName"
                    defaultValue={editingTour?.tourName ?? ''}
                    placeholder="e.g., Thailand May Batch"
                    required
                  />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input
                    name="destination"
                    defaultValue={editingTour?.destination ?? ''}
                    placeholder="e.g., Bangkok, Phuket"
                    required
                  />
                </div>
                <div>
                  <Label>Departure Date</Label>
                  <Input
                    name="departureDate"
                    type="date"
                    defaultValue={editingTour?.departureDate.slice(0, 10) ?? ''}
                    required
                  />
                </div>
                <div>
                  <Label>Return Date</Label>
                  <Input
                    name="returnDate"
                    type="date"
                    defaultValue={editingTour?.returnDate.slice(0, 10) ?? ''}
                    required
                  />
                </div>
                <div>
                  <Label>Total Seats</Label>
                  <Input
                    name="totalSeats"
                    type="number"
                    min="1"
                    defaultValue={editingTour?.totalSeats ?? ''}
                    placeholder="40"
                    required
                  />
                </div>
                <div>
                  <Label>Adult Price Per Person (INR)</Label>
                  <Input
                    name="packagePrice"
                    type="number"
                    min="0"
                    defaultValue={editingTour?.packagePrice ?? ''}
                    placeholder="45000"
                    required
                  />
                </div>
                <div>
                  <Label>Child Price Per Person (INR)</Label>
                  <Input
                    name="childPrice"
                    type="number"
                    min="1"
                    defaultValue={editingTour?.childPrice ?? ''}
                    placeholder="30000"
                    required
                  />
                </div>
                <div>
                  <Label>Pickup City</Label>
                  <Input
                    name="pickupCity"
                    defaultValue={editingTour?.pickupCity ?? ''}
                    placeholder="Delhi"
                    required
                  />
                </div>
                <div>
                  <Label>Tour Manager</Label>
                  <Input
                    name="tourManager"
                    defaultValue={editingTour?.tourManager ?? ''}
                    placeholder="Manager name"
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    name="status"
                    defaultValue={editingTour?.status ?? 'active'}
                    className="h-10 w-full rounded border px-3 text-sm"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {formError && (
                  <p className="md:col-span-2 text-sm text-red-600">{formError}</p>
                )}
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingTour ? 'Update Tour' : 'Create Tour'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingTour(null);
                      setShowForm(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {viewingTour ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{viewingTour.tourName}</CardTitle>
                  <CardDescription>{viewingTour.tourCode}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingTour(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-medium">{viewingTour.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pickup City</p>
                    <p className="font-medium">{viewingTour.pickupCity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Departure</p>
                    <p className="font-medium">{formatDate(viewingTour.departureDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Return</p>
                    <p className="font-medium">{formatDate(viewingTour.returnDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seats</p>
                    <p className="font-medium">
                      {viewingTour.occupiedSeats}/{viewingTour.totalSeats}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Manager</p>
                    <p className="font-medium">{viewingTour.tourManager}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adult Price</p>
                    <p className="font-medium">{formatCurrency(viewingTour.packagePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Child Price</p>
                    <p className="font-medium">
                      {formatCurrency(viewingTour.childPrice ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(viewingTour.status)}>
                      {viewingTour.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Tour Batches</CardTitle>
            <CardDescription>
              {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search by tour name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full sm:w-72"
              />
              <FilterSelect
                label="Destination"
                value={destinationFilter}
                options={filterOptions.destinations.map((destination) => ({
                  label: destination,
                  value: destination,
                }))}
                onChange={setDestinationFilter}
                onClear={() => setDestinationFilter('')}
              />
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                aria-label="Start date"
                className="h-9 w-full sm:w-40"
              />
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                aria-label="End date"
                className="h-9 w-full sm:w-40"
              />
              {(startDateFilter || endDateFilter) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="h-9"
                >
                  Clear dates
                </Button>
              ) : null}
            </div>
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
                          <button
                            type="button"
                            onClick={() => setViewingTour(tour)}
                            className="font-medium hover:text-blue-600 hover:underline"
                          >
                            {tour.tourName}
                          </button>
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
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>Adult: {formatCurrency(tour.packagePrice)}</p>
                          <p>Child: {formatCurrency(tour.childPrice ?? 0)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{tour.tourManager}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tour.status)}>
                          {tour.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingTour(tour)}
                            aria-label={`View ${tour.tourName}`}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTour(tour);
                              setFormError('');
                              setShowForm(true);
                            }}
                            aria-label={`Edit ${tour.tourName}`}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Total Tours</p>
              <p className="text-3xl font-bold">{displayTours.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600">Active Tours</p>
              <p className="text-3xl font-bold">
                {displayTours.filter((t) => t.status === 'active').length}
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
