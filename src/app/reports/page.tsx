'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useRecords } from '@/lib/use-records';
import { Download } from 'lucide-react';
import { useState } from 'react';

const mockReports = {
  tourWiseRevenue: [
    {
      tourName: 'Thailand May Batch',
      totalTravelers: 35,
      packagePrice: 45000,
      totalRevenue: 1575000,
      totalAdvancePaid: 1338750,
      totalPending: 236250,
      profitMargin: 28,
    },
    {
      tourName: 'Kashmir June Batch',
      totalTravelers: 12,
      packagePrice: 35000,
      totalRevenue: 420000,
      totalAdvancePaid: 180000,
      totalPending: 240000,
      profitMargin: 22,
    },
    {
      tourName: 'Dubai July Batch',
      totalTravelers: 8,
      packagePrice: 55000,
      totalRevenue: 440000,
      totalAdvancePaid: 240000,
      totalPending: 200000,
      profitMargin: 32,
    },
  ],
  pendingPayments: [
    {
      travelerName: 'Rajesh Kumar',
      tour: 'Thailand May Batch',
      amount: 10000,
      dueDate: '2026-05-15',
      daysOverdue: 10,
    },
    {
      travelerName: 'Amit Patel',
      tour: 'Kashmir June Batch',
      amount: 20000,
      dueDate: '2026-06-01',
      daysOverdue: 0,
    },
    {
      travelerName: 'Ananya Sharma',
      tour: 'Dubai July Batch',
      amount: 25000,
      dueDate: '2026-06-15',
      daysOverdue: 0,
    },
  ],
  seatOccupancy: [
    {
      tourName: 'Thailand May Batch',
      totalSeats: 40,
      occupiedSeats: 35,
      occupancyPercentage: 87.5,
      revenue: 1575000,
    },
    {
      tourName: 'Kashmir June Batch',
      totalSeats: 30,
      occupiedSeats: 12,
      occupancyPercentage: 40,
      revenue: 420000,
    },
    {
      tourName: 'Dubai July Batch',
      totalSeats: 20,
      occupiedSeats: 8,
      occupancyPercentage: 40,
      revenue: 440000,
    },
  ],
  profitability: [
    {
      tourName: 'Thailand May Batch',
      revenue: 1575000,
      costs: 1134000,
      profit: 441000,
      profitMargin: 28,
    },
    {
      tourName: 'Kashmir June Batch',
      revenue: 420000,
      costs: 327600,
      profit: 92400,
      profitMargin: 22,
    },
    {
      tourName: 'Dubai July Batch',
      revenue: 440000,
      costs: 299200,
      profit: 140800,
      profitMargin: 32,
    },
  ],
};


export default function ReportsPage() {
  const [reports] = useRecords('/api/reports', {
    tourWiseRevenue: [],
    pendingPayments: [],
    seatOccupancy: [],
    profitability: [],
  } as typeof mockReports);
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [dateRange, setDateRange] = useState('all');
  const generateExcel = () => {
    alert('Excel export functionality would be implemented here');
  };

  const generatePDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Tour analytics, revenue, and operations reports</p>
      </div>

      {/* Report Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
                <option value="revenue">Tour-wise Revenue</option>
                <option value="pending">Pending Payments</option>
                <option value="occupancy">Seat Occupancy</option>
                <option value="profitability">Profitability Analysis</option>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={generateExcel}>
              <Download size={16} className="mr-2" />
              Export to Excel
            </Button>
            <Button variant="outline" onClick={generatePDF}>
              <Download size={16} className="mr-2" />
              Export to PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tour-wise Revenue Report */}
      {selectedReport === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(
                      reports.tourWiseRevenue.reduce((acc, t) => acc + t.totalRevenue, 0)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Collected</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">
                    {formatCurrency(
                      reports.tourWiseRevenue.reduce((acc, t) => acc + t.totalAdvancePaid, 0)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold mt-2 text-orange-600">
                    {formatCurrency(
                      reports.tourWiseRevenue.reduce((acc, t) => acc + t.totalPending, 0)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tour-wise Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tour Name</TableHead>
                      <TableHead>Travelers</TableHead>
                      <TableHead>Package Price</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Profit %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.tourWiseRevenue.map((tour, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{tour.tourName}</TableCell>
                        <TableCell>{tour.totalTravelers}</TableCell>
                        <TableCell>{formatCurrency(tour.packagePrice)}</TableCell>
                        <TableCell>{formatCurrency(tour.totalRevenue)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(tour.totalAdvancePaid)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(tour.totalPending)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{tour.profitMargin}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Payments Report */}
      {selectedReport === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments Report</CardTitle>
            <CardDescription>Travelers with outstanding balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Traveler Name</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Pending Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.pendingPayments.map((payment, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{payment.travelerName}</TableCell>
                      <TableCell>{payment.tour}</TableCell>
                      <TableCell className="text-orange-600 font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>
                        {payment.daysOverdue > 0 ? (
                          <Badge variant="destructive">{payment.daysOverdue} days</Badge>
                        ) : (
                          <Badge variant="secondary">On track</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={payment.daysOverdue > 0 ? 'destructive' : 'warning'}
                        >
                          {payment.daysOverdue > 0 ? 'Overdue' : 'Due Soon'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seat Occupancy Report */}
      {selectedReport === 'occupancy' && (
        <Card>
          <CardHeader>
            <CardTitle>Seat Occupancy Report</CardTitle>
            <CardDescription>Tour seat utilization and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tour Name</TableHead>
                    <TableHead>Total Seats</TableHead>
                    <TableHead>Occupied Seats</TableHead>
                    <TableHead>Occupancy %</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.seatOccupancy.map((tour, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{tour.tourName}</TableCell>
                      <TableCell>{tour.totalSeats}</TableCell>
                      <TableCell>{tour.occupiedSeats}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${tour.occupancyPercentage}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {tour.occupancyPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(tour.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profitability Report */}
      {selectedReport === 'profitability' && (
        <Card>
          <CardHeader>
            <CardTitle>Profitability Analysis</CardTitle>
            <CardDescription>Tour profit margins and cost analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tour Name</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Costs</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Profit Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.profitability.map((tour, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{tour.tourName}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(tour.revenue)}
                      </TableCell>
                      <TableCell>{formatCurrency(tour.costs)}</TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {formatCurrency(tour.profit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{tour.profitMargin}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}
