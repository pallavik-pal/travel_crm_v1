'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PlusCircle, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

type CustomerPayment = {
  id: string;
  bookingCode: string;
  travelerName: string;
  passengerNames: string[];
  familyMembers: string[];
  tour: string;
  totalAmount: number;
  advancePaid: number;
  balance: number;
  dueDate: string;
  status: string;
  paymentMode: string;
  transactionId: string;
  logs: {
    id: string;
    amountPaid: number;
    paymentDate: string;
    paymentMode: string;
    transactionId: string;
    createdAt: string;
  }[];
};

const paymentDetail = (mode?: string, utr?: string) => {
  const parts = [mode, utr ? `UTR: ${utr}` : ''].filter(Boolean);

  return parts.length ? parts.join(' | ') : '-';
};

const sortedClearances = (payment: CustomerPayment) =>
  [...payment.logs].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime();
    const secondTime = new Date(second.createdAt).getTime();

    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    return first.id.localeCompare(second.id);
  });

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    partial: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useRecords('/api/customer-payments', [] as CustomerPayment[]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const totalAmount = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const totalAdvance = payments.reduce((sum, payment) => sum + payment.advancePaid, 0);
  const totalBalance = payments.reduce((sum, payment) => sum + payment.balance, 0);
  const pendingPayments = payments.filter((payment) => payment.balance > 0);
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId);
  const formPaymentOptions =
    selectedPayment && !pendingPayments.some((payment) => payment.id === selectedPayment.id)
      ? [selectedPayment, ...pendingPayments]
      : pendingPayments;
  const clearanceColumnCount = useMemo(
    () =>
      Math.max(
        1,
        ...payments.map((payment) => sortedClearances(payment).length + 1)
      ),
    [payments]
  );
  const selectedClearanceNumber = selectedPayment
    ? sortedClearances(selectedPayment).length + 1
    : 1;

  const openClearanceForm = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setFormError('');
    setShowForm(true);
  };

  const closeClearanceForm = () => {
    setSelectedPaymentId('');
    setFormError('');
    setShowForm(false);
  };

  const handleAddPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to add payment.');
      }

      setPayments(data);
      form.reset();
      setSelectedPaymentId('');
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to add payment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-2rem)] min-w-0 max-w-full flex-col gap-6 overflow-hidden lg:h-[calc(100vh-4rem)]">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Payments</h1>
            <p className="mt-1 text-sm text-gray-600">
              Advance payments collected from customer bookings.
            </p>
          </div>
          <Button onClick={() => (showForm ? closeClearanceForm() : setShowForm(true))}>
            {showForm ? <X className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {showForm ? 'Close' : 'Add Payment'}
          </Button>
        </div>

        <div className="grid shrink-0 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Booking Amount</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Advance Collected</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {formatCurrency(totalAdvance)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Balance Pending</p>
              <p className="mt-2 text-2xl font-bold text-red-700">
                {formatCurrency(totalBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {showForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Add Clearance {selectedClearanceNumber}</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={closeClearanceForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPayment} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Booking</Label>
                    <select
                      name="paymentId"
                      value={selectedPaymentId}
                      onChange={(event) => setSelectedPaymentId(event.target.value)}
                      className="h-10 w-full rounded border px-3 text-sm"
                      required
                    >
                      <option value="">Select booking</option>
                      {formPaymentOptions.map((payment) => (
                        <option key={payment.id} value={payment.id}>
                          {payment.bookingCode} - {payment.travelerName} -{' '}
                          {formatCurrency(payment.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      name="amountPaid"
                      type="number"
                      min="1"
                      max={
                        selectedPayment && selectedPayment.balance > 0
                          ? selectedPayment.balance
                          : undefined
                      }
                      placeholder="Amount received"
                      required
                    />
                  </div>
                  <div>
                    <Label>Payment Date</Label>
                    <Input name="paymentDate" type="date" />
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <select
                      name="paymentMode"
                      className="h-10 w-full rounded border px-3 text-sm"
                      required
                    >
                      <option value="">Select mode</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <Label>Transaction / UTR</Label>
                    <Input name="transactionId" placeholder="Optional reference" />
                  </div>
                  {formError ? (
                    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
                      {formError}
                    </div>
                  ) : null}
                  <div className="flex gap-2 md:col-span-2">
                    <Button type="submit" disabled={isSaving} className="flex-1">
                      {isSaving ? 'Saving...' : 'Save Payment'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeClearanceForm}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <div className="h-full max-w-full overflow-auto">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tour</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Advance</TableHead>
                    {Array.from({ length: clearanceColumnCount }, (_, index) => (
                      <TableHead key={`clearance-heading-${index}`}>
                        Clearance {index + 1}
                      </TableHead>
                    ))}
                    <TableHead>Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const clearances = sortedClearances(payment);

                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.bookingCode}</TableCell>
                        <TableCell>
                          <div>
                            {(payment.passengerNames?.length
                              ? payment.passengerNames
                              : [payment.travelerName, ...payment.familyMembers]
                            ).map((passengerName, index) => (
                              <p
                                key={`${payment.id}-${passengerName}-${index}`}
                                className={index === 0 ? 'font-medium' : 'text-sm text-gray-600'}
                              >
                                {passengerName}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{payment.tour}</TableCell>
                        <TableCell>{formatCurrency(payment.totalAmount)}</TableCell>
                        <TableCell>
                          <p className="font-medium text-green-700">
                            {formatCurrency(payment.advancePaid)}
                          </p>
                          <p className="text-xs capitalize text-gray-500">
                            {paymentDetail(payment.paymentMode, payment.transactionId)}
                          </p>
                        </TableCell>
                        {Array.from({ length: clearanceColumnCount }, (_, index) => {
                          const clearance = clearances[index];
                          const isNextClearance = index === clearances.length;

                          return (
                            <TableCell key={`${payment.id}-clearance-${index}`}>
                              {clearance ? (
                                <>
                                  <p className="font-medium text-blue-700">
                                    {formatCurrency(clearance.amountPaid)}
                                  </p>
                                  <p className="text-xs capitalize text-gray-500">
                                    {paymentDetail(
                                      clearance.paymentMode,
                                      clearance.transactionId
                                    )}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500">-</p>
                              )}
                              {isNextClearance ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openClearanceForm(payment.id)}
                                  className="mt-2"
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Clearance {index + 1}
                                </Button>
                              ) : null}
                            </TableCell>
                          );
                        })}
                        <TableCell>{formatCurrency(payment.balance)}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {!payments.length ? (
              <div className="rounded border bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                No customer payments recorded yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
