import { getPayments } from '@/lib/records';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getPayments());
}

export async function POST(request: Request) {
  const body = await request.json();
  const paymentId = String(body.paymentId || '').trim();
  const amountPaid = Math.round(Number(body.amountPaid));
  const paymentMode = String(body.paymentMode || '').trim();
  const transactionId = String(body.transactionId || '').trim();
  const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

  if (!paymentId || !paymentMode || !Number.isFinite(amountPaid) || amountPaid <= 0) {
    return NextResponse.json(
      { error: 'Payment, amount, and mode are required' },
      { status: 400 }
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { customerPaymentLogs: true },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Payment was not found' }, { status: 404 });
  }

  const clearancePaid = payment.customerPaymentLogs.reduce(
    (sum, log) => sum + log.amountPaid,
    0
  );
  const currentBalance = Math.max(payment.totalAmount - payment.advancePaid - clearancePaid, 0);

  if (amountPaid > currentBalance) {
    return NextResponse.json(
      { error: 'Payment amount cannot be more than the pending balance' },
      { status: 400 }
    );
  }

  const balanceAmount = Math.max(currentBalance - amountPaid, 0);
  const status = balanceAmount === 0 ? 'paid' : 'partial';

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      balanceAmount,
      status,
    },
  });

  await prisma.customerPaymentLog.create({
    data: {
      paymentId,
      amountPaid,
      paymentDate,
      paymentMode,
      transactionId: transactionId || null,
    },
  });

  return NextResponse.json(await getPayments());
}
