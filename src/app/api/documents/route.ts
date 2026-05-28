import { getDocuments } from '@/lib/records';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getDocuments(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let body: Record<string, FormDataEntryValue | string> = {};
  let file: File | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    formData.forEach((value, key) => {
      if (!(value instanceof File)) {
        body[key] = value;
      }
    });
    const uploadedFile = formData.get('file');
    file = uploadedFile instanceof File && uploadedFile.name ? uploadedFile : undefined;
  } else {
    body = await request.json();
  }

  const bookingCode = typeof body.bookingCode === 'string' ? body.bookingCode : '';
  const documentType = typeof body.type === 'string' ? body.type : '';
  const passengerName = typeof body.passengerName === 'string' ? body.passengerName : '';
  const expiryDate = typeof body.expiryDate === 'string' ? body.expiryDate : '';
  const status = typeof body.status === 'string' ? body.status : '';
  const fileName = file?.name || (typeof body.fileName === 'string' ? body.fileName : '');

  if (!bookingCode || !documentType || !fileName) {
    return NextResponse.json(
      { error: 'Booking code, document type, and file name are required' },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: { traveler: true, members: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking was not found' }, { status: 404 });
  }

  await prisma.document.create({
    data: {
      bookingId: booking.id,
      type: documentType,
      fileName,
      url: `db://${fileName}`,
      mimeType: file?.type || null,
      fileSize: file?.size || null,
      fileData: file ? new Uint8Array(await file.arrayBuffer()) : undefined,
      passengerName: passengerName || booking.traveler.fullName,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: status || 'pending',
    },
  });

  const [savedDocument] = await getDocuments();
  return NextResponse.json(savedDocument, { status: 201 });
}
