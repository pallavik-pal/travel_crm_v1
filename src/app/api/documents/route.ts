import { getDocuments } from '@/lib/records';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getDocuments());
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.bookingCode || !body.type || !body.fileName) {
    return NextResponse.json(
      { error: 'Booking code, document type, and file name are required' },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: body.bookingCode },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking was not found' }, { status: 404 });
  }

  await prisma.document.create({
    data: {
      bookingId: booking.id,
      type: body.type,
      fileName: body.fileName,
      url: `/documents/${body.fileName}`,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      status: body.status || 'pending',
    },
  });

  const [savedDocument] = await getDocuments();
  return NextResponse.json(savedDocument, { status: 201 });
}
