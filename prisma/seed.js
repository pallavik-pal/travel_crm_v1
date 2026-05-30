/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const date = (value) => new Date(`${value}T00:00:00.000Z`);
const hashPassword = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function main() {
  await prisma.roomAllocation.deleteMany();
  await prisma.operationsStatus.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  await prisma.appSetting.create({
    data: {
      organizationName: 'Travel Adventures Inc.',
      defaultCurrency: 'INR',
      timezone: 'IST',
      emailNotifications: true,
      smsAlerts: true,
      dailySummaryReport: false,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'CRM Admin',
      username: 'employee',
      password: hashPassword('employee123'),
      role: 'admin',
      access: [
        'dashboard',
        'tours',
        'bookings',
        'travelers',
        'payments',
        'customer-payments',
        'operations',
        'documents',
        'reports',
        'settings',
      ],
    },
  });

  const thailand = await prisma.tour.create({
    data: {
      tourName: 'Thailand May Batch',
      tourCode: 'TR-202505-A1',
      destination: 'Bangkok, Phuket',
      departureDate: date('2026-05-30'),
      returnDate: date('2026-06-06'),
      totalSeats: 40,
      packagePrice: 45000,
      pickupCity: 'Delhi',
      tourManager: 'Rajesh Kumar',
      status: 'active',
      costEstimate: 1134000,
    },
  });

  const kashmir = await prisma.tour.create({
    data: {
      tourName: 'Kashmir June Batch',
      tourCode: 'TR-202506-B1',
      destination: 'Srinagar, Gulmarg',
      departureDate: date('2026-06-15'),
      returnDate: date('2026-06-22'),
      totalSeats: 30,
      packagePrice: 35000,
      pickupCity: 'Delhi',
      tourManager: 'Priya Singh',
      status: 'draft',
      costEstimate: 327600,
    },
  });

  const dubai = await prisma.tour.create({
    data: {
      tourName: 'Dubai July Batch',
      tourCode: 'TR-202507-C1',
      destination: 'Dubai, Abu Dhabi',
      departureDate: date('2026-07-10'),
      returnDate: date('2026-07-17'),
      totalSeats: 20,
      packagePrice: 55000,
      pickupCity: 'Mumbai',
      tourManager: 'Amit Patel',
      status: 'draft',
      costEstimate: 299200,
    },
  });

  const rajesh = await prisma.traveler.create({
    data: {
      serialNumber: 1,
      fullName: 'Rajesh Kumar',
      gender: 'male',
      dateOfBirth: date('1985-06-20'),
      phone: '9876543210',
      email: 'rajesh@email.com',
      address: 'Delhi',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
    },
  });

  const priya = await prisma.traveler.create({
    data: {
      serialNumber: 2,
      fullName: 'Priya Singh',
      gender: 'female',
      dateOfBirth: date('1990-03-15'),
      phone: '9876543211',
      email: 'priya@email.com',
      address: 'Delhi',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
    },
  });

  const amit = await prisma.traveler.create({
    data: {
      serialNumber: 3,
      fullName: 'Amit Patel',
      gender: 'male',
      phone: '9876543212',
      email: 'amit@email.com',
      address: 'Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    },
  });

  const ananya = await prisma.traveler.create({
    data: {
      serialNumber: 4,
      fullName: 'Ananya Sharma',
      gender: 'female',
      phone: '9876543213',
      email: 'ananya@email.com',
      address: 'Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    },
  });

  const bookings = [
    {
      code: 'BK-202505-ABC123',
      tourId: thailand.id,
      travelerId: rajesh.id,
      seat: 'A-01',
      room: 'double',
      total: 45000,
      paid: 35000,
      status: 'partial',
      due: '2026-05-15',
      mode: 'bank_transfer',
      pnr: 'AB123456',
      flight: 'confirmed',
      visa: 'approved',
      hotel: 'confirmed',
      ticketIssued: true,
    },
    {
      code: 'BK-202505-DEF456',
      tourId: thailand.id,
      travelerId: priya.id,
      seat: 'A-02',
      room: 'single',
      total: 45000,
      paid: 45000,
      status: 'paid',
      due: '2026-05-15',
      mode: 'card',
      pnr: 'AB123457',
      flight: 'pending',
      visa: 'pending',
      hotel: 'confirmed',
      ticketIssued: false,
    },
    {
      code: 'BK-202505-GHI789',
      tourId: kashmir.id,
      travelerId: amit.id,
      seat: 'B-01',
      room: 'triple',
      total: 35000,
      paid: 15000,
      status: 'pending',
      due: '2026-06-01',
      mode: 'upi',
      pnr: null,
      flight: 'pending',
      visa: 'pending',
      hotel: 'pending',
      ticketIssued: false,
    },
    {
      code: 'BK-202507-JKL012',
      tourId: dubai.id,
      travelerId: ananya.id,
      seat: 'C-01',
      room: 'double',
      total: 55000,
      paid: 30000,
      status: 'partial',
      due: '2026-06-15',
      mode: 'upi',
      pnr: null,
      flight: 'pending',
      visa: 'pending',
      hotel: 'pending',
      ticketIssued: false,
    },
  ];

  for (const booking of bookings) {
    const created = await prisma.booking.create({
      data: {
        bookingCode: booking.code,
        tourId: booking.tourId,
        travelerId: booking.travelerId,
        pickupPoint: 'Delhi Airport',
        seatNumber: booking.seat,
        roomSharingPreference: booking.room,
        status: 'confirmed',
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: created.id,
        totalAmount: booking.total,
        advancePaid: booking.paid,
        balanceAmount: booking.total - booking.paid,
        status: booking.status,
        paymentDate: date('2026-04-20'),
        dueDate: date(booking.due),
        paymentMode: booking.mode,
      },
    });

    await prisma.operationsStatus.create({
      data: {
        bookingId: created.id,
        pnr: booking.pnr,
        flightStatus: booking.flight,
        visaStatus: booking.visa,
        hotelStatus: booking.hotel,
        ticketIssued: booking.ticketIssued,
        authenticationStatus: 'verified',
      },
    });
  }

  const rajeshBooking = await prisma.booking.findUnique({ where: { bookingCode: 'BK-202505-ABC123' } });
  const priyaBooking = await prisma.booking.findUnique({ where: { bookingCode: 'BK-202505-DEF456' } });
  const amitBooking = await prisma.booking.findUnique({ where: { bookingCode: 'BK-202505-GHI789' } });

  await prisma.document.createMany({
    data: [
      {
        bookingId: rajeshBooking.id,
        type: 'passport',
        url: '/documents/rajesh_passport.pdf',
        fileName: 'rajesh_passport.pdf',
        uploadedAt: date('2026-04-20'),
        expiryDate: date('2030-06-15'),
        status: 'verified',
      },
      {
        bookingId: rajeshBooking.id,
        type: 'aadhaar',
        url: '/documents/rajesh_aadhaar.pdf',
        fileName: 'rajesh_aadhaar.pdf',
        uploadedAt: date('2026-04-20'),
        status: 'verified',
      },
      {
        bookingId: rajeshBooking.id,
        type: 'pan',
        url: '/documents/rajesh_pan.pdf',
        fileName: 'rajesh_pan.pdf',
        uploadedAt: date('2026-04-20'),
        status: 'verified',
      },
      {
        bookingId: priyaBooking.id,
        type: 'aadhaar',
        url: '/documents/priya_aadhaar.pdf',
        fileName: 'priya_aadhaar.pdf',
        uploadedAt: date('2026-04-22'),
        status: 'pending',
      },
      {
        bookingId: amitBooking.id,
        type: 'passport',
        url: '/documents/amit_passport.pdf',
        fileName: 'amit_passport.pdf',
        uploadedAt: date('2026-04-18'),
        expiryDate: date('2031-09-10'),
        status: 'verified',
      },
    ],
  });

  await prisma.roomAllocation.create({
    data: {
      tourId: thailand.id,
      roomNumber: '101',
      capacity: 2,
      occupants: 'Rajesh Kumar, Priya Singh',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
