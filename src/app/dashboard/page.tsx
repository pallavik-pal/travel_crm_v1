'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useRecords } from '@/lib/use-records';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    BarChart3,
    CreditCard,
    FileText,
    Plane,
    Users
} from 'lucide-react';

// Mock data
const mockStats = {
  totalTours: 8,
  activeTravelers: 47,
  pendingPayments: 12,
  upcomingDepartures: 3,
};

const mockTours = [
  {
    id: '1',
    name: 'Thailand May Batch',
    departure: '2026-05-30',
    seats: 35,
    totalSeats: 40,
    paymentCompletion: 85,
  },
  {
    id: '2',
    name: 'Kashmir June Batch',
    departure: '2026-06-15',
    seats: 12,
    totalSeats: 30,
    paymentCompletion: 60,
  },
  {
    id: '3',
    name: 'Dubai July Batch',
    departure: '2026-07-10',
    seats: 8,
    totalSeats: 20,
    paymentCompletion: 40,
  },
];

const mockPendingPayments = [
  {
    id: 1,
    travelerName: 'Rajesh Kumar',
    tour: 'Thailand May Batch',
    pending: 25000,
    status: 'overdue',
  },
  {
    id: 2,
    travelerName: 'Priya Singh',
    tour: 'Kashmir June Batch',
    pending: 15000,
    status: 'pending',
  },
  {
    id: 3,
    travelerName: 'Amit Patel',
    tour: 'Thailand May Batch',
    pending: 10000,
    status: 'pending',
  },
];

const mockOperationAlerts = [
  {
    id: 1,
    title: 'Ticket not issued',
    traveler: 'Rajesh Kumar',
    severity: 'high',
  },
  {
    id: 2,
    title: 'Hotel pending',
    traveler: 'Priya Singh',
    severity: 'medium',
  },
  {
    id: 3,
    title: 'Visa not approved',
    traveler: 'Amit Patel',
    severity: 'high',
  },
];

const mockPendingDocuments = [
  {
    id: 1,
    travelerName: 'John Doe',
    missing: ['Passport', 'Visa'],
  },
  {
    id: 2,
    travelerName: 'Jane Smith',
    missing: ['PAN'],
  },
  {
    id: 3,
    travelerName: 'Robert Johnson',
    missing: ['Aadhaar', 'Passport'],
  },
];

const mockDashboard = {
  stats: mockStats,
  tours: mockTours,
  pendingPayments: mockPendingPayments,
  operationAlerts: mockOperationAlerts,
  pendingDocuments: mockPendingDocuments,
};

const emptyDashboard: typeof mockDashboard = {
  stats: {
    totalTours: 0,
    activeTravelers: 0,
    pendingPayments: 0,
    upcomingDepartures: 0,
  },
  tours: [],
  pendingPayments: [],
  operationAlerts: [],
  pendingDocuments: [],
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

function DashboardContent() {
  const [dashboard] = useRecords('/api/dashboard', emptyDashboard);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your group tour operations overview.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tours"
          value={dashboard.stats.totalTours}
          icon={Plane}
          color="blue"
        />
        <StatCard
          title="Active Travelers"
          value={dashboard.stats.activeTravelers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Pending Payments"
          value={dashboard.stats.pendingPayments}
          icon={CreditCard}
          color="orange"
        />
        <StatCard
          title="Upcoming Departures"
          value={dashboard.stats.upcomingDepartures}
          icon={BarChart3}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tours */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tours</CardTitle>
              <CardDescription>Active tour batches and occupancy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.tours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/tours/${tour.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                      <p className="text-sm text-gray-600">
                        Departure: {formatDate(tour.departure)}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(tour.seats / tour.totalSeats) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {tour.seats}/{tour.totalSeats}
                        </span>
                      </div>
                    </div>
                    <Badge variant="default">
                      {tour.paymentCompletion}%
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="default" asChild>
              <Link href="/tours?action=create">Create New Tour</Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/bookings?action=create">Add Booking</Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/payments">Record Payment</Link>
            </Button>
            <Button className="w-full" variant="outline">
              Send Reminders
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Pending Payments</span>
            </CardTitle>
            <CardDescription>Travelers with due balances</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Traveler</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.pendingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.travelerName}</TableCell>
                    <TableCell>{formatCurrency(payment.pending)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === 'overdue' ? 'destructive' : 'warning'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Pending Documents</span>
            </CardTitle>
            <CardDescription>Missing traveler documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Traveler</TableHead>
                  <TableHead>Missing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.pendingDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.travelerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doc.missing.map((item) => (
                          <Badge key={item} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Operations Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <span>Operations Alerts</span>
          </CardTitle>
          <CardDescription>Critical operations issues needing attention</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Traveler</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.operationAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.title}</TableCell>
                  <TableCell>{alert.traveler}</TableCell>
                  <TableCell>
                    <Badge
                      variant={alert.severity === 'high' ? 'destructive' : 'warning'}
                    >
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}
