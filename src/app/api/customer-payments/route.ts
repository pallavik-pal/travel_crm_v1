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
  });

  if (!payment) {
    return NextResponse.json({ error: 'Payment was not found' }, { status: 404 });
  }

  if (amountPaid > payment.balanceAmount) {
    return NextResponse.json(
      { error: 'Payment amount cannot be more than the pending balance' },
      { status: 400 }
    );
  }

  const advancePaid = payment.advancePaid + amountPaid;
  const balanceAmount = Math.max(payment.totalAmount - advancePaid, 0);
  const status = balanceAmount === 0 ? 'completed' : 'partial';

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      advancePaid,
      balanceAmount,
      status,
      paymentDate,
      paymentMode,
      transactionId: transactionId || payment.transactionId,
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
