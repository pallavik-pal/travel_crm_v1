import { getBookings } from '@/lib/records';
import { generateBookingCode } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

type DocumentInput = {
  type: string;
  fileName: string;
  passengerName: string;
  mimeType?: string;
  fileSize?: number;
  fileData?: Uint8Array<ArrayBuffer>;
};

const cleanFamilyMembers = (members: unknown) => {
  if (!Array.isArray(members)) {
    return [];
  }

  return members
    .filter(
      (member): member is Record<string, unknown> =>
        typeof member === 'object' &&
        member !== null &&
        (typeof (member as Record<string, unknown>).fullName === 'string' ||
          typeof (member as Record<string, unknown>).firstName === 'string')
    )
    .map((member) => ({
      serialNumber:
        typeof member.serialNumber === 'number'
          ? member.serialNumber
          : Number(member.serialNumber) || null,
      fullName:
        typeof member.fullName === 'string' && member.fullName.trim()
          ? member.fullName.trim()
          : [
              typeof member.firstName === 'string' ? member.firstName.trim() : '',
              typeof member.lastName === 'string' ? member.lastName.trim() : '',
            ]
              .filter(Boolean)
              .join(' '),
      gender: typeof member.gender === 'string' ? member.gender : null,
      dateOfBirth:
        typeof member.dateOfBirth === 'string' && member.dateOfBirth
          ? new Date(member.dateOfBirth)
          : null,
      phone: typeof member.phone === 'string' ? member.phone : null,
      email: typeof member.email === 'string' ? member.email : null,
      relation: typeof member.relation === 'string' ? member.relation : null,
    }))
    .filter((member) => member.fullName.length > 0);
};

const getFullName = (body: Record<string, unknown>) => {
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';

  return [firstName, lastName].filter(Boolean).join(' ') || fullName;
};

const getOptionalDate = (value: unknown) =>
  typeof value === 'string' && value ? new Date(value) : null;

const getOptionalString = (value: unknown) =>
  typeof value === 'string' && value ? value : null;

const getRequestBody = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    return {
      body: (await request.json()) as Record<string, unknown>,
      files: new Map<string, File>(),
    };
  }

  const formData = await request.formData();
  const body: Record<string, unknown> = {};
  const files = new Map<string, File>();

  formData.forEach((value, key) => {
    if (value instanceof File) {
      if (value.name) {
        files.set(key, value);
      }
      return;
    }

    if ((key === 'familyMembers' || key === 'roomPreferences') && value) {
      try {
        body[key] = JSON.parse(value);
      } catch {
        body[key] = [];
      }
      return;
    }

    body[key] = value;
  });

  return { body, files };
};

const getNextTourSerialNumber = async (tourId: string, excludeBookingId?: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      tourId,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: {
      traveler: true,
      members: true,
    },
  });

  const serialNumbers = bookings.flatMap((booking) => [
    booking.traveler.serialNumber,
    ...booking.members
      .map((member) => member.serialNumber)
      .filter((serialNumber): serialNumber is number => typeof serialNumber === 'number'),
  ]);

  return serialNumbers.length > 0 ? Math.max(...serialNumbers) + 1 : 1;
};

const serializeRoomPreferences = (rooms: unknown) => {
  if (!Array.isArray(rooms)) {
    return null;
  }

  const cleanedRooms = rooms
    .filter(
      (room): room is Record<string, string> =>
        typeof room === 'object' &&
        room !== null &&
        typeof (room as Record<string, string>).preferenceType === 'string' &&
        (room as Record<string, string>).preferenceType.trim().length > 0
    )
    .map((room, index) => ({
      roomNumber: `Room ${index + 1}`,
      preferenceType: room.preferenceType,
    }));

  return cleanedRooms.length > 0 ? JSON.stringify(cleanedRooms) : null;
};

const getUploadedDocument = async (
  file: File | undefined,
  fallbackFileName: unknown
) => {
  if (!file?.name) {
    return typeof fallbackFileName === 'string' ? { fileName: fallbackFileName } : null;
  }

  return {
    fileName: file.name,
    mimeType: file.type || undefined,
    fileSize: file.size,
    fileData: new Uint8Array(await file.arrayBuffer()),
  };
};

const getFamilyDocuments = async (members: unknown, files: Map<string, File>) => {
  if (!Array.isArray(members)) {
    return [];
  }

  const documents: DocumentInput[] = [];

  for (const member of members) {
    if (typeof member !== 'object' || member === null) {
      continue;
    }

    const record = member as Record<string, string>;
    const passengerName =
      record.fullName?.trim() ||
      [record.firstName?.trim(), record.lastName?.trim()].filter(Boolean).join(' ');
    const aadhaar = await getUploadedDocument(
      files.get(record.aadhaarFileField),
      record.aadhaarFileName
    );
    const pan = await getUploadedDocument(files.get(record.panFileField), record.panFileName);
    const passport = await getUploadedDocument(
      files.get(record.passportFileField),
      record.passportFileName
    );

    const memberDocuments: DocumentInput[] = [];

    if (aadhaar) {
      memberDocuments.push({ type: 'aadhaar', passengerName, ...aadhaar });
    }

    if (pan) {
      memberDocuments.push({ type: 'pan', passengerName, ...pan });
    }

    if (passport) {
      memberDocuments.push({ type: 'passport', passengerName, ...passport });
    }

    documents.push(...memberDocuments);
  }

  return documents;
};

const getDocumentsFromBody = async (
  body: Record<string, unknown>,
  passengerName: string,
  files: Map<string, File>
) => {
  const documents: DocumentInput[] = [];
  const aadhaar = await getUploadedDocument(files.get('aadhaar'), body.aadhaarFileName);
  const pan = await getUploadedDocument(files.get('pan'), body.panFileName);
  const passport = await getUploadedDocument(files.get('passport'), body.passportFileName);

  if (aadhaar) {
    documents.push({ type: 'aadhaar', passengerName, ...aadhaar });
  }

  if (pan) {
    documents.push({ type: 'pan', passengerName, ...pan });
  }

  if (passport) {
    documents.push({ type: 'passport', passengerName, ...passport });
  }

  documents.push(...(await getFamilyDocuments(body.familyMembers, files)));

  return documents;
};

const saveDocuments = async (bookingId: string, documents: DocumentInput[]) => {
  if (documents.length === 0) {
    return;
  }

  await Promise.all(
    documents.map(async (document) => {
      const where = {
        bookingId,
        type: document.type,
        passengerName: document.passengerName,
      };
      const existingDocument =
        (await prisma.document.findFirst({ where })) ||
        (!document.fileData
          ? await prisma.document.findFirst({
              where: {
                bookingId,
                type: document.type,
                fileName: document.fileName,
              },
            })
          : null);

      if (!document.fileData && existingDocument) {
        return prisma.document.update({
          where: { id: existingDocument.id },
          data: { passengerName: document.passengerName },
        });
      }

      if (existingDocument) {
        await prisma.document.delete({ where: { id: existingDocument.id } });
      }

      return prisma.document.create({
        data: {
          bookingId,
          type: document.type,
          url: `db://${document.fileName}`,
          fileName: document.fileName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          fileData: document.fileData,
          passengerName: document.passengerName,
          status: 'pending',
        },
      });
    })
  );
};

const hasRequiredDocuments = (documents: DocumentInput[], passengerName: string) =>
  ['aadhaar', 'pan', 'passport'].every((type) =>
    documents.some(
      (document) =>
        document.passengerName === passengerName &&
        document.type === type &&
        document.fileName
    )
  );

const getMissingDocumentPassenger = (
  documents: DocumentInput[],
  mainPassengerName: string,
  familyMembers: ReturnType<typeof cleanFamilyMembers>
) => {
  if (!hasRequiredDocuments(documents, mainPassengerName)) {
    return 'the main passenger';
  }

  return familyMembers.find((member) => !hasRequiredDocuments(documents, member.fullName))
    ?.fullName;
};

export async function GET() {
  return NextResponse.json(await getBookings(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  const { body, files } = await getRequestBody(request);
  const fullName = getFullName(body);
  const tourId = typeof body.tourId === 'string' ? body.tourId : '';
  const phone = typeof body.phone === 'string' ? body.phone : '';

  if (!fullName || !phone || !tourId || !body.totalAmount || !body.advancePaid) {
    return NextResponse.json(
      { error: 'First name, phone, tour, total amount, and advance paid are required' },
      { status: 400 }
    );
  }

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
  });

  if (!tour) {
    return NextResponse.json({ error: 'Selected tour was not found' }, { status: 404 });
  }

  const totalAmount = Number(body.totalAmount);
  const advancePaid = Number(body.advancePaid);
  const balanceAmount = Math.max(totalAmount - advancePaid, 0);

  const firstSerialNumber = await getNextTourSerialNumber(tour.id);
  const traveler = await prisma.traveler.create({
    data: {
      serialNumber: firstSerialNumber,
      fullName,
      phone,
      email: getOptionalString(body.email),
      gender: getOptionalString(body.gender),
      dateOfBirth: getOptionalDate(body.dateOfBirth),
      address: getOptionalString(body.address),
    },
  });

  const booking = await prisma.booking.create({
    data: {
      bookingCode: generateBookingCode(),
      tourId: tour.id,
      travelerId: traveler.id,
      bookedBy: getOptionalString(body.bookedBy),
      pickupPoint: getOptionalString(body.pickupPoint),
      seatNumber: getOptionalString(body.seatNumber),
      roomSharingPreference: serializeRoomPreferences(body.roomPreferences),
      status: 'confirmed',
    },
  });

  const familyMembers = cleanFamilyMembers(body.familyMembers);
  const documents = await getDocumentsFromBody(body, fullName, files);
  const missingDocumentPassenger = getMissingDocumentPassenger(
    documents,
    fullName,
    familyMembers
  );

  if (missingDocumentPassenger) {
    return NextResponse.json(
      {
        error: `Aadhaar, PAN, and Passport are required for ${missingDocumentPassenger}.`,
      },
      { status: 400 }
    );
  }

  if (familyMembers.length > 0) {
    await prisma.bookingMember.createMany({
      data: familyMembers.map((member, index) => ({
        bookingId: booking.id,
        ...member,
        serialNumber: firstSerialNumber + index + 1,
      })),
    });
  }

  const paymentStatus =
    balanceAmount === 0 ? 'paid' : advancePaid > 0 ? 'partial' : 'pending';

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      totalAmount,
      advancePaid,
      balanceAmount,
      status: paymentStatus,
      paymentDate: getOptionalDate(body.paymentDate),
      dueDate: getOptionalDate(body.dueDate) ?? new Date(),
      paymentMode: getOptionalString(body.paymentMode) ?? 'cash',
      transactionId: getOptionalString(body.transactionId),
    },
  });

  await prisma.operationsStatus.create({
    data: {
      bookingId: booking.id,
      pnr: getOptionalString(body.pnr),
      flightStatus: getOptionalString(body.flightStatus) ?? 'pending',
      visaStatus: getOptionalString(body.visaStatus) ?? 'pending',
      hotelStatus: getOptionalString(body.hotelStatus) ?? 'pending',
      ticketIssued: false,
      authenticationStatus: 'pending',
    },
  });

  await saveDocuments(booking.id, documents);

  const savedBooking = (await getBookings()).find((item) => item.id === booking.id);
  return NextResponse.json(savedBooking, { status: 201 });
}

export async function PATCH(request: Request) {
  const { body, files } = await getRequestBody(request);
  const fullName = getFullName(body);
  const bookingId = typeof body.id === 'string' ? body.id : '';

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking id is required' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      traveler: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      operationsStatus: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking was not found' }, { status: 404 });
  }

  const requestedTourId = typeof body.tourId === 'string' ? body.tourId : '';
  const tour = requestedTourId
    ? await prisma.tour.findUnique({ where: { id: requestedTourId } })
    : null;

  if (requestedTourId && !tour) {
    return NextResponse.json({ error: 'Selected tour was not found' }, { status: 404 });
  }

  const targetTourId = requestedTourId || booking.tourId;
  const isChangingTour = targetTourId !== booking.tourId;
  const travelerSerialNumber = isChangingTour
    ? await getNextTourSerialNumber(targetTourId, booking.id)
    : booking.traveler.serialNumber;

  await prisma.traveler.update({
    where: { id: booking.travelerId },
    data: {
      serialNumber: travelerSerialNumber,
      fullName: fullName || booking.traveler.fullName,
      phone: getOptionalString(body.phone) ?? booking.traveler.phone,
      email: getOptionalString(body.email),
      gender: getOptionalString(body.gender),
      dateOfBirth: getOptionalDate(body.dateOfBirth),
      address: getOptionalString(body.address),
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      tourId: targetTourId,
      bookedBy: getOptionalString(body.bookedBy),
      pickupPoint: getOptionalString(body.pickupPoint),
      seatNumber: getOptionalString(body.seatNumber),
      roomSharingPreference: serializeRoomPreferences(body.roomPreferences),
      status: getOptionalString(body.status) ?? booking.status,
    },
  });

  const payment = booking.payments[0];
  const totalAmount = Number(body.totalAmount ?? payment?.totalAmount ?? 0);
  const advancePaid = Number(body.advancePaid ?? payment?.advancePaid ?? 0);
  const balanceAmount = Math.max(totalAmount - advancePaid, 0);
  const paymentStatus =
    balanceAmount === 0 ? 'paid' : advancePaid > 0 ? 'partial' : 'pending';
  const paymentData = {
    totalAmount,
    advancePaid,
    balanceAmount,
    status: paymentStatus,
    paymentDate: getOptionalDate(body.paymentDate),
    dueDate: getOptionalDate(body.dueDate) ?? payment?.dueDate ?? new Date(),
    paymentMode: getOptionalString(body.paymentMode) ?? payment?.paymentMode ?? 'cash',
    transactionId: getOptionalString(body.transactionId),
  };

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: paymentData,
    });
  } else {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        ...paymentData,
      },
    });
  }

  if (booking.operationsStatus) {
    await prisma.operationsStatus.update({
      where: { id: booking.operationsStatus.id },
      data: {
        pnr: getOptionalString(body.pnr),
        flightStatus: getOptionalString(body.flightStatus) ?? booking.operationsStatus.flightStatus,
        visaStatus: getOptionalString(body.visaStatus) ?? booking.operationsStatus.visaStatus,
        hotelStatus: getOptionalString(body.hotelStatus) ?? booking.operationsStatus.hotelStatus,
      },
    });
  } else {
    await prisma.operationsStatus.create({
      data: {
        bookingId: booking.id,
        pnr: getOptionalString(body.pnr),
        flightStatus: getOptionalString(body.flightStatus) ?? 'pending',
        visaStatus: getOptionalString(body.visaStatus) ?? 'pending',
        hotelStatus: getOptionalString(body.hotelStatus) ?? 'pending',
      },
    });
  }

  const familyMembers = cleanFamilyMembers(body.familyMembers);
  const documents = await getDocumentsFromBody(
    body,
    fullName || booking.traveler.fullName,
    files
  );
  const missingDocumentPassenger = getMissingDocumentPassenger(
    documents,
    fullName || booking.traveler.fullName,
    familyMembers
  );

  if (missingDocumentPassenger) {
    return NextResponse.json(
      {
        error: `Aadhaar, PAN, and Passport are required for ${missingDocumentPassenger}.`,
      },
      { status: 400 }
    );
  }

  await prisma.bookingMember.deleteMany({
    where: { bookingId: booking.id },
  });

  if (familyMembers.length > 0) {
    let nextSerialNumber = isChangingTour
      ? travelerSerialNumber + 1
      : await getNextTourSerialNumber(targetTourId, booking.id);
    await prisma.bookingMember.createMany({
      data: familyMembers.map((member) => ({
        bookingId: booking.id,
        ...member,
        serialNumber: isChangingTour
          ? nextSerialNumber++
          : member.serialNumber ?? nextSerialNumber++,
      })),
    });
  }

  await saveDocuments(booking.id, documents);

  const savedBooking = (await getBookings()).find((item) => item.id === booking.id);
  return NextResponse.json(savedBooking);
}

export async function DELETE(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Booking id is required' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: body.id },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking was not found' }, { status: 404 });
  }

  await prisma.operationsStatus.deleteMany({ where: { bookingId: booking.id } });
  await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
  await prisma.document.deleteMany({ where: { bookingId: booking.id } });
  await prisma.bookingMember.deleteMany({ where: { bookingId: booking.id } });
  await prisma.booking.delete({ where: { id: booking.id } });

  return NextResponse.json({ id: booking.id });
}
