import { prisma } from '@/lib/db';

const documentMetadataSelect = {
  id: true,
  type: true,
  fileName: true,
  passengerName: true,
  uploadedAt: true,
  expiryDate: true,
  status: true,
} as const;

const hasTourEnded = (returnDate: Date) => returnDate.getTime() < Date.now();

export const tourStatusForReturnDate = (returnDate: Date, status: string) =>
  hasTourEnded(returnDate) ? 'completed' : status;

const completeEndedTours = async () => {
  await prisma.tour.updateMany({
    where: {
      returnDate: { lt: new Date() },
      status: { not: 'completed' },
    },
    data: {
      status: 'completed',
    },
  });
};

export async function getTours() {
  await completeEndedTours();

  const tours = await prisma.tour.findMany({
    include: { bookings: { include: { members: true } } },
    orderBy: { departureDate: 'asc' },
  });

  return tours.map((tour) => ({
    id: tour.id,
    tourName: tour.tourName,
    tourCode: tour.tourCode,
    destination: tour.destination,
    departureDate: tour.departureDate.toISOString(),
    returnDate: tour.returnDate.toISOString(),
    totalSeats: tour.totalSeats,
    occupiedSeats: tour.bookings.reduce(
      (sum, booking) => sum + 1 + booking.members.length,
      0
    ),
    packagePrice: tour.packagePrice,
    childPrice: tour.childPrice || tour.packagePrice,
    pickupCity: tour.pickupCity,
    tourManager: tour.tourManager,
    status: tourStatusForReturnDate(tour.returnDate, tour.status),
  }));
}

export async function getTourDetails(id: string) {
  await completeEndedTours();

  const tour = await prisma.tour.findUnique({
    where: { id },
    include: {
      rooms: true,
      bookings: {
        include: {
          traveler: true,
          members: true,
          documents: { select: documentMetadataSelect },
          operationsStatus: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!tour) {
    return null;
  }

  return {
    id: tour.id,
    tourName: tour.tourName,
    tourCode: tour.tourCode,
    destination: tour.destination,
    departureDate: tour.departureDate.toISOString(),
    returnDate: tour.returnDate.toISOString(),
    totalSeats: tour.totalSeats,
    occupiedSeats: tour.bookings.reduce(
      (sum, booking) => sum + 1 + booking.members.length,
      0
    ),
    packagePrice: tour.packagePrice,
    childPrice: tour.childPrice || tour.packagePrice,
    pickupCity: tour.pickupCity,
    tourManager: tour.tourManager,
    status: tourStatusForReturnDate(tour.returnDate, tour.status),
    rooms: tour.rooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      occupants: room.occupants.split(',').map((occupant) => occupant.trim()),
      notes: room.notes,
    })),
    bookings: tour.bookings.map((booking) => {
      const payment = booking.payments[0];

      return {
        id: booking.id,
        bookingCode: booking.bookingCode,
        bookedBy: booking.bookedBy ?? '',
        status: booking.status,
        pickupPoint: booking.pickupPoint ?? '',
        seatNumber: booking.seatNumber ?? '',
        roomSharingPreference: booking.roomSharingPreference ?? '',
        createdAt: booking.createdAt.toISOString(),
        traveler: {
          id: booking.traveler.id,
          serialNumber: booking.traveler.serialNumber,
          fullName: booking.traveler.fullName,
          phone: booking.traveler.phone,
          email: booking.traveler.email ?? '',
          gender: booking.traveler.gender ?? '',
          dateOfBirth: booking.traveler.dateOfBirth?.toISOString() ?? null,
          address: booking.traveler.address ?? '',
          city: booking.traveler.city ?? '',
          state: booking.traveler.state ?? '',
          postalCode: booking.traveler.postalCode ?? '',
        },
        members: booking.members
          .map((member) => ({
            id: member.id,
            serialNumber: member.serialNumber ?? null,
            fullName: member.fullName,
            gender: member.gender ?? '',
            dateOfBirth: member.dateOfBirth?.toISOString() ?? null,
            phone: member.phone ?? '',
            email: member.email ?? '',
            relation: member.relation ?? '',
          }))
          .sort(
            (first, second) =>
              (first.serialNumber ?? Number.MAX_SAFE_INTEGER) -
              (second.serialNumber ?? Number.MAX_SAFE_INTEGER)
          ),
        payment: {
          totalAmount: payment?.totalAmount ?? tour.packagePrice,
          advancePaid: payment?.advancePaid ?? 0,
          balanceAmount: payment?.balanceAmount ?? tour.packagePrice,
          status: payment?.status ?? 'pending',
          paymentDate: payment?.paymentDate?.toISOString() ?? null,
          dueDate: payment?.dueDate.toISOString() ?? null,
          paymentMode: payment?.paymentMode ?? '',
        },
        documents: booking.documents.map((document) => ({
          id: document.id,
          type: document.type,
          fileName: document.fileName,
          status: document.status,
          expiryDate: document.expiryDate?.toISOString() ?? null,
        })),
        operations: {
          pnr: booking.operationsStatus?.pnr ?? '',
          flightStatus: booking.operationsStatus?.flightStatus ?? 'not_required',
          visaStatus: booking.operationsStatus?.visaStatus ?? 'not_required',
          hotelStatus: booking.operationsStatus?.hotelStatus ?? 'pending',
          ticketIssued: booking.operationsStatus?.ticketIssued ?? false,
          authenticationStatus: booking.operationsStatus?.authenticationStatus ?? 'pending',
        },
      };
    }).sort((first, second) => first.traveler.serialNumber - second.traveler.serialNumber),
  };
}

export async function getBookings() {
  const bookings = await prisma.booking.findMany({
    include: {
      tour: true,
      traveler: true,
      members: true,
      documents: { select: documentMetadataSelect },
      operationsStatus: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings.map((booking) => {
    const payment = booking.payments[0];
    const usedDocumentIds = new Set<string>();
    const documentFileName = (passengerName: string, type: string, useLegacyFallback = false) => {
      const exactDocument = booking.documents.find(
        (document) =>
          !usedDocumentIds.has(document.id) &&
          document.type === type &&
          document.passengerName === passengerName
      );

      if (exactDocument) {
        usedDocumentIds.add(exactDocument.id);
        return exactDocument.fileName;
      }

      const fallbackDocument = booking.documents.find(
        (document) =>
          !usedDocumentIds.has(document.id) &&
          document.type === type &&
          (useLegacyFallback || !document.passengerName)
      );

      if (fallbackDocument) {
        usedDocumentIds.add(fallbackDocument.id);
        return fallbackDocument.fileName;
      }

      return '';
    };
    const additionalDocumentList = (passengerName: string) =>
      booking.documents
        .filter(
          (document) =>
            !usedDocumentIds.has(document.id) &&
            document.passengerName === passengerName &&
            !['aadhaar', 'pan'].includes(document.type)
        )
        .map((document) => {
          usedDocumentIds.add(document.id);

          return {
            id: document.id,
            type: document.type,
            fileName: document.fileName,
          };
        });

    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      bookedBy: booking.bookedBy ?? '',
      travelerName: booking.traveler.fullName,
      tour: booking.tour.tourName,
      phone: booking.traveler.phone,
      email: booking.traveler.email ?? '',
      gender: booking.traveler.gender ?? '',
      dateOfBirth: booking.traveler.dateOfBirth?.toISOString() ?? '',
      address: booking.traveler.address ?? '',
      aadhaarFileName: documentFileName(booking.traveler.fullName, 'aadhaar', true),
      panFileName: documentFileName(booking.traveler.fullName, 'pan', true),
      passportFileName: '',
      additionalDocuments: additionalDocumentList(booking.traveler.fullName),
      memberCount: booking.members.length,
      members: booking.members
        .map((member) => ({
          id: member.id,
          serialNumber: member.serialNumber ?? null,
          fullName: member.fullName,
          gender: member.gender ?? '',
          dateOfBirth: member.dateOfBirth?.toISOString() ?? '',
          phone: member.phone ?? '',
          email: member.email ?? '',
          relation: member.relation ?? '',
          aadhaarFileName: documentFileName(member.fullName, 'aadhaar', true),
          panFileName: documentFileName(member.fullName, 'pan', true),
          passportFileName: '',
          additionalDocuments: additionalDocumentList(member.fullName),
        }))
        .sort(
          (first, second) =>
            (first.serialNumber ?? Number.MAX_SAFE_INTEGER) -
            (second.serialNumber ?? Number.MAX_SAFE_INTEGER)
        ),
      seat: booking.seatNumber ?? '',
      roomSharing: booking.roomSharingPreference ?? '',
      pickupPoint: booking.pickupPoint ?? '',
      totalAmount: payment?.totalAmount ?? booking.tour.packagePrice,
      advancePaid: payment?.advancePaid ?? 0,
      balance: payment?.balanceAmount ?? booking.tour.packagePrice,
      paymentDate: payment?.paymentDate?.toISOString() ?? '',
      dueDate: payment?.dueDate.toISOString() ?? '',
      paymentMode: payment?.paymentMode ?? '',
      transactionId: payment?.transactionId ?? '',
      pnr: booking.operationsStatus?.pnr ?? '',
      flightStatus: booking.operationsStatus?.flightStatus ?? '',
      visaStatus: booking.operationsStatus?.visaStatus ?? '',
      hotelStatus: booking.operationsStatus?.hotelStatus ?? '',
      paymentStatus: payment?.status ?? 'pending',
      status: booking.status,
    };
  });
}

export async function getTravelers() {
  const travelers = await prisma.traveler.findMany({
    include: {
      bookings: {
        include: {
          tour: true,
          documents: { select: documentMetadataSelect },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: { serialNumber: 'asc' },
  });

  return travelers.map((traveler) => {
    const booking = traveler.bookings[0];
    const documents = booking?.documents ?? [];

    return {
      id: traveler.id,
      name: traveler.fullName,
      email: traveler.email ?? '',
      phone: traveler.phone,
      tour: booking?.tour.tourName ?? 'Unassigned',
      bookingDate: booking?.createdAt.toISOString() ?? traveler.createdAt.toISOString(),
      gender: traveler.gender ? traveler.gender[0].toUpperCase() + traveler.gender.slice(1) : '',
      dob: traveler.dateOfBirth?.toISOString(),
      documents: {
        aadhaar: documents.some((document) => document.type === 'aadhaar'),
        pan: documents.some((document) => document.type === 'pan'),
        passport: documents.some((document) => document.type === 'passport'),
      },
      paymentStatus: booking?.payments[0]?.status ?? 'pending',
      totalBookings: traveler.bookings.length,
    };
  });
}

export async function getPayments() {
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          tour: true,
          traveler: true,
          members: true,
        },
      },
      customerPaymentLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return payments.map((payment) => ({
    id: payment.id,
    bookingCode: payment.booking.bookingCode,
    travelerName: payment.booking.traveler.fullName,
    familyMembers: payment.booking.members
      .map((member) => member.fullName)
      .sort((first, second) => first.localeCompare(second)),
    tour: payment.booking.tour.tourName,
    totalAmount: payment.totalAmount,
    advancePaid: payment.advancePaid,
    balance: payment.balanceAmount,
    dueDate: payment.dueDate.toISOString(),
    status: payment.balanceAmount === 0 ? 'completed' : payment.status,
    paymentMode: payment.paymentMode.replace('_', ' '),
    logs: payment.customerPaymentLogs.map((log) => ({
      id: log.id,
      amountPaid: log.amountPaid,
      paymentDate: log.paymentDate.toISOString(),
      paymentMode: log.paymentMode.replace('_', ' '),
      transactionId: log.transactionId ?? '',
      createdAt: log.createdAt.toISOString(),
    })),
  }));
}

export async function getDocuments() {
  const documents = await prisma.document.findMany({
    select: {
      ...documentMetadataSelect,
      booking: {
        select: {
          tour: true,
          traveler: true,
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  return documents.map((document) => ({
    id: document.id,
    travelerName: document.passengerName ?? document.booking.traveler.fullName,
    type: document.type,
    fileName: document.fileName,
    uploadedAt: document.uploadedAt.toISOString(),
    expiryDate: document.expiryDate?.toISOString() ?? null,
    status: document.status,
    tour: document.booking.tour.tourName,
  }));
}

export async function getOperationsTours() {
  const tours = await prisma.tour.findMany({
    include: {
      rooms: true,
      bookings: {
        include: {
          traveler: true,
          operationsStatus: true,
        },
      },
    },
    orderBy: { departureDate: 'asc' },
  });

  return tours.map((tour) => ({
    id: tour.id,
    name: tour.tourName,
    departure: tour.departureDate.toISOString(),
    travelers: tour.bookings.map((booking) => ({
      id: booking.id,
      name: booking.traveler.fullName,
      pnr: booking.operationsStatus?.pnr ?? '',
      flightStatus: booking.operationsStatus?.flightStatus ?? 'not_required',
      visaStatus: booking.operationsStatus?.visaStatus ?? 'not_required',
      hotelStatus: booking.operationsStatus?.hotelStatus ?? 'pending',
      ticketIssued: booking.operationsStatus?.ticketIssued ?? false,
    })),
    rooms: tour.rooms.map((room) => ({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      occupants: room.occupants.split(',').map((occupant) => occupant.trim()),
    })),
  }));
}

export async function getSettings() {
  const [settings, user] = await Promise.all([
    prisma.appSetting.findFirst(),
    prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }),
  ]);

  return {
    settings,
    user,
  };
}

export async function getReports() {
  const [tours, payments] = await Promise.all([
    prisma.tour.findMany({
      include: {
        bookings: {
          include: {
            members: true,
            payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { departureDate: 'asc' },
    }),
    getPayments(),
  ]);

  const tourWiseRevenue = tours.map((tour) => {
    const totalTravelers = tour.bookings.reduce(
      (sum, booking) => sum + 1 + booking.members.length,
      0
    );
    const totalRevenue = totalTravelers * tour.packagePrice;
    const totalAdvancePaid = tour.bookings.reduce(
      (sum, booking) => sum + (booking.payments[0]?.advancePaid ?? 0),
      0
    );
    const totalPending = tour.bookings.reduce(
      (sum, booking) => sum + (booking.payments[0]?.balanceAmount ?? tour.packagePrice),
      0
    );
    const profit = totalRevenue - tour.costEstimate;
    const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

    return {
      tourName: tour.tourName,
      totalTravelers,
      packagePrice: tour.packagePrice,
      totalRevenue,
      totalAdvancePaid,
      totalPending,
      profitMargin,
    };
  });

  return {
    tourWiseRevenue,
    pendingPayments: payments
      .filter((payment) => payment.balance > 0)
      .map((payment) => ({
        travelerName: payment.travelerName,
        tour: payment.tour,
        amount: payment.balance,
        dueDate: payment.dueDate,
        daysOverdue: Math.max(
          0,
          Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / 86400000)
        ),
      })),
    seatOccupancy: tourWiseRevenue.map((tour, index) => ({
      tourName: tour.tourName,
      totalSeats: tours[index].totalSeats,
      occupiedSeats: tour.totalTravelers,
      occupancyPercentage:
        tours[index].totalSeats > 0 ? (tour.totalTravelers / tours[index].totalSeats) * 100 : 0,
      revenue: tour.totalRevenue,
    })),
    profitability: tourWiseRevenue.map((tour, index) => ({
      tourName: tour.tourName,
      revenue: tour.totalRevenue,
      costs: tours[index].costEstimate,
      profit: tour.totalRevenue - tours[index].costEstimate,
      profitMargin: tour.profitMargin,
    })),
  };
}

export async function getDashboard() {
  const [tours, travelers, payments, operationsTours] = await Promise.all([
    getTours(),
    getTravelers(),
    getPayments(),
    getOperationsTours(),
  ]);

  return {
    stats: {
      totalTours: tours.length,
      activeTravelers: tours.reduce((sum, tour) => sum + tour.occupiedSeats, 0),
      pendingPayments: payments.filter((payment) => payment.balance > 0).length,
      upcomingDepartures: tours.filter((tour) => new Date(tour.departureDate) >= new Date()).length,
    },
    tours: tours.map((tour) => {
      const tourPayments = payments.filter((payment) => payment.tour === tour.tourName);
      const total = tourPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
      const collected = tourPayments.reduce((sum, payment) => sum + payment.advancePaid, 0);

      return {
        id: tour.id,
        name: tour.tourName,
        departure: tour.departureDate,
        seats: tour.occupiedSeats,
        totalSeats: tour.totalSeats,
        paymentCompletion: total > 0 ? Math.round((collected / total) * 100) : 0,
      };
    }),
    pendingPayments: payments
      .filter((payment) => payment.balance > 0)
      .map((payment) => ({
        id: payment.id,
        travelerName: payment.travelerName,
        tour: payment.tour,
        pending: payment.balance,
        status: payment.status,
      })),
    operationAlerts: operationsTours.flatMap((tour) =>
      tour.travelers
        .filter(
          (traveler) =>
            !traveler.ticketIssued ||
            traveler.hotelStatus === 'pending' ||
            traveler.visaStatus === 'pending'
        )
        .map((traveler) => ({
          id: `${tour.id}-${traveler.id}`,
          title: !traveler.ticketIssued
            ? 'Ticket not issued'
            : traveler.hotelStatus === 'pending'
              ? 'Hotel pending'
              : 'Visa not approved',
          traveler: traveler.name,
          severity: !traveler.ticketIssued ? 'high' : 'medium',
        }))
    ),
    pendingDocuments: travelers
      .map((traveler) => ({
        id: traveler.id,
        travelerName: traveler.name,
        missing: Object.entries(traveler.documents)
          .filter(([, uploaded]) => !uploaded)
          .map(([type]) => type[0].toUpperCase() + type.slice(1)),
      }))
      .filter((traveler) => traveler.missing.length > 0),
  };
}
