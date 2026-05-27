'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/constants';
import { PlusCircle, ReceiptText, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

type Tour = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  categoryName: string;
  totalAmount: number;
  totalPaid: number;
  amountYetToPay: number;
  logs: {
    id: string;
    amountPaid: number;
    utrNumber: string;
    createdAt: string;
  }[];
};

export default function PaymentsPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => setTours(data.tours || []))
      .catch(() => setPageError('Unable to load tour batches.'));
  }, []);

  useEffect(() => {
    if (!selectedTour) {
      return;
    }

    fetch(`/api/payments?tourId=${selectedTour}`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setPageError('Unable to load payment records.'))
      .finally(() => setIsLoading(false));
  }, [selectedTour]);

  const refresh = async () => {
    if (!selectedTour) return;

    const res = await fetch(`/api/payments?tourId=${selectedTour}`);
    const data = await res.json();
    setCategories(data);
  };

  const setTotal = async (categoryId: string, totalAmount: number) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set-total',
        categoryId,
        totalAmount,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Unable to save total amount.');
    }

    await refresh();
  };

  const addPayment = async (
    categoryId: string,
    amountPaid: number,
    utrNumber: string
  ) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add-payment',
        categoryId,
        amountPaid,
        utrNumber,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Unable to add payment.');
    }

    await refresh();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Operational Payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Maintain DMC, flights, bus, train, and chef payable records for each tour batch.
          </p>
        </div>

        <select
          value={selectedTour}
          onChange={(e) => {
            const tourId = e.target.value;
            setCategories([]);
            setPageError('');
            setIsLoading(Boolean(tourId));
            setSelectedTour(tourId);
          }}
          className="h-10 w-full rounded border px-3"
        >
          <option value="">Select Tour Batch</option>
          {tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.name}
            </option>
          ))}
        </select>

        {pageError ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded border bg-white px-4 py-8 text-center text-sm text-gray-600">
            Loading payment records...
          </div>
        ) : null}

        {!selectedTour ? (
          <div className="rounded border bg-white px-4 py-8 text-center text-sm text-gray-600">
            Select a tour batch to enter totals and record UTR payments.
          </div>
        ) : null}

        {categories.map((category) => (
          <PaymentSection
            key={`${category.id}-${category.totalAmount}`}
            category={category}
            onSetTotal={setTotal}
            onAddPayment={addPayment}
          />
        ))}
      </div>
    </MainLayout>
  );
}

function PaymentSection({
  category,
  onSetTotal,
  onAddPayment,
}: {
  category: Category;
  onSetTotal: (id: string, total: number) => Promise<void>;
  onAddPayment: (id: string, amount: number, utr: string) => Promise<void>;
}) {
  const [total, setTotal] = useState(String(category.totalAmount || ''));
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [isSavingTotal, setIsSavingTotal] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const isPaid = category.amountYetToPay === 0 && category.totalAmount > 0;

  const handleSetTotal = async () => {
    setError('');
    setIsSavingTotal(true);

    try {
      await onSetTotal(category.id, Number(total));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save total amount.');
    } finally {
      setIsSavingTotal(false);
    }
  };

  const handleAddPayment = async () => {
    setError('');
    setIsAddingPayment(true);

    try {
      await onAddPayment(category.id, Number(amount), utr);
      setAmount('');
      setUtr('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add payment.');
    } finally {
      setIsAddingPayment(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{category.categoryName}</CardTitle>
        <Badge variant={isPaid ? 'success' : category.totalPaid > 0 ? 'warning' : 'secondary'}>
          {isPaid ? 'Paid' : category.totalPaid > 0 ? 'Partial' : 'Pending'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Total amount to be paid
                </p>
                <Input
                  type="number"
                  min="0"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="Enter total payable"
                />
              </div>
              <Button
                className="self-end"
                onClick={handleSetTotal}
                disabled={isSavingTotal}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSavingTotal ? 'Saving' : 'Save Total'}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Total</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(category.totalAmount)}
                </p>
              </div>
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Paid</p>
                <p className="mt-1 text-lg font-semibold text-green-700">
                  {formatCurrency(category.totalPaid)}
                </p>
              </div>
              <div className="rounded border bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Remaining</p>
                <p className="mt-1 text-lg font-semibold text-red-700">
                  {formatCurrency(category.amountYetToPay)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded border bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <ReceiptText className="h-4 w-4" />
              Record payment by UTR
            </div>
            <Input
              type="number"
              min="1"
              placeholder="Amount paid"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Input
              placeholder="UTR number"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />

            <Button
              onClick={handleAddPayment}
              disabled={isAddingPayment || !amount || !utr || category.amountYetToPay <= 0}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {isAddingPayment ? 'Adding' : 'Add Payment'}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div>
          <h3 className="font-semibold">Payment Logs</h3>
          {category.logs.length ? (
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>UTR</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {formatCurrency(log.amountPaid)}
                    </TableCell>
                    <TableCell>{log.utrNumber}</TableCell>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-2 rounded border bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              No payments recorded yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
