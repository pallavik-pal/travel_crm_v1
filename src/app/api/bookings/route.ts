import { getBookings } from '@/lib/records';
import { generateBookingCode } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const cleanFamilyMembers = (members: unknown) => {
  if (!Array.isArray(members)) {
    return [];
  }

  return members
    .filter(
      (member): member is Record<string, string> =>
        typeof member === 'object' &&
        member !== null &&
        typeof (member as Record<string, string>).fullName === 'string' &&
        (member as Record<string, string>).fullName.trim().length > 0
    )
    .map((member) => ({
      fullName: member.fullName.trim(),
      gender: member.gender || null,
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
      phone: member.phone || null,
      email: member.email || null,
      relation: member.relation || null,
    }));
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

const getFamilyDocuments = (members: unknown) => {
  if (!Array.isArray(members)) {
    return [];
  }

  return members.flatMap((member) => {
    if (typeof member !== 'object' || member === null) {
      return [];
    }

    const record = member as Record<string, string>;
    return [
      { type: 'aadhaar', fileName: record.aadhaarFileName },
      { type: 'pan', fileName: record.panFileName },
      { type: 'passport', fileName: record.passportFileName },
    ].filter((document) => document.fileName);
  });
};

const getDocumentsFromBody = (body: Record<string, unknown>) =>
  [
    { type: 'aadhaar', fileName: body.aadhaarFileName },
    { type: 'pan', fileName: body.panFileName },
    { type: 'passport', fileName: body.passportFileName },
    ...getFamilyDocuments(body.familyMembers),
  ].filter(
    (document): document is { type: string; fileName: string } =>
      typeof document.fileName === 'string' && document.fileName.length > 0
  );

const saveDocuments = async (bookingId: string, documents: { type: string; fileName: string }[]) => {
  if (documents.length === 0) {
    return;
  }

  await prisma.document.createMany({
    data: documents.map((document) => ({
      bookingId,
      type: document.type,
      url: `/documents/${document.fileName}`,
      fileName: document.fileName,
      status: 'pending',
    })),
  });
};

export async function GET() {
  return NextResponse.json(await getBookings());
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.fullName || !body.phone || !body.tourId || !body.totalAmount || !body.advancePaid) {
    return NextResponse.json(
      { error: 'Full name, phone, tour, total amount, and advance paid are required' },
      { status: 400 }
    );
  }

  const tour = await prisma.tour.findUnique({
    where: { id: body.tourId },
  });

  if (!tour) {
    return NextResponse.json({ error: 'Selected tour was not found' }, { status: 404 });
  }

  const totalAmount = Number(body.totalAmount);
  const advancePaid = Number(body.advancePaid);
  const balanceAmount = Math.max(totalAmount - advancePaid, 0);

  const travelerCount = await prisma.traveler.count();
  const traveler = await prisma.traveler.create({
    data: {
      serialNumber: travelerCount + 1,
      fullName: body.fullName,
      phone: body.phone,
      email: body.email || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      address: body.address || null,
    },
  });

  const booking = await prisma.booking.create({
    data: {
      bookingCode: generateBookingCode(),
      tourId: tour.id,
      travelerId: traveler.id,
      pickupPoint: body.pickupPoint || null,
      seatNumber: body.seatNumber || null,
      roomSharingPreference: serializeRoomPreferences(body.roomPreferences),
      status: 'confirmed',
    },
  });

  const familyMembers = cleanFamilyMembers(body.familyMembers);

  if (familyMembers.length > 0) {
    await prisma.bookingMember.createMany({
      data: familyMembers.map((member) => ({
        bookingId: booking.id,
        ...member,
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
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
      paymentMode: body.paymentMode || 'cash',
      transactionId: body.transactionId || null,
    },
  });

  await prisma.operationsStatus.create({
    data: {
      bookingId: booking.id,
      pnr: body.pnr || null,
      flightStatus: body.flightStatus || 'pending',
      visaStatus: body.visaStatus || 'pending',
      hotelStatus: body.hotelStatus || 'pending',
      ticketIssued: false,
      authenticationStatus: 'pending',
    },
  });

  await saveDocuments(booking.id, getDocumentsFromBody(body));

  const [savedBooking] = await getBookings();
  return NextResponse.json(savedBooking, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Booking id is required' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: body.id },
    include: {
      traveler: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      operationsStatus: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking was not found' }, { status: 404 });
  }

  const tour = body.tourId
    ? await prisma.tour.findUnique({ where: { id: body.tourId } })
    : null;

  if (body.tourId && !tour) {
    return NextResponse.json({ error: 'Selected tour was not found' }, { status: 404 });
  }

  await prisma.traveler.update({
    where: { id: booking.travelerId },
    data: {
      fullName: body.fullName || booking.traveler.fullName,
      phone: body.phone || booking.traveler.phone,
      email: body.email || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      address: body.address || null,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      tourId: body.tourId || booking.tourId,
      pickupPoint: body.pickupPoint || null,
      seatNumber: body.seatNumber || null,
      roomSharingPreference: serializeRoomPreferences(body.roomPreferences),
      status: body.status || booking.status,
    },
  });

  if (booking.operationsStatus) {
    await prisma.operationsStatus.update({
      where: { id: booking.operationsStatus.id },
      data: {
        pnr: body.pnr || null,
        flightStatus: body.flightStatus || booking.operationsStatus.flightStatus,
        visaStatus: body.visaStatus || booking.operationsStatus.visaStatus,
        hotelStatus: body.hotelStatus || booking.operationsStatus.hotelStatus,
      },
    });
  } else {
    await prisma.operationsStatus.create({
      data: {
        bookingId: booking.id,
        pnr: body.pnr || null,
        flightStatus: body.flightStatus || 'pending',
        visaStatus: body.visaStatus || 'pending',
        hotelStatus: body.hotelStatus || 'pending',
      },
    });
  }

  const familyMembers = cleanFamilyMembers(body.familyMembers);
  await prisma.bookingMember.deleteMany({
    where: { bookingId: booking.id },
  });

  if (familyMembers.length > 0) {
    await prisma.bookingMember.createMany({
      data: familyMembers.map((member) => ({
        bookingId: booking.id,
        ...member,
      })),
    });
  }

  await saveDocuments(booking.id, getDocumentsFromBody(body));

  const savedBooking = (await getBookings()).find((item) => item.id === booking.id);
  return NextResponse.json(savedBooking);
}
