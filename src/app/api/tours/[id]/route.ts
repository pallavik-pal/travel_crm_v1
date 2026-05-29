import { getTourDetails, tourStatusForReturnDate } from '@/lib/records';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tour = await getTourDetails(id);

  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
  }

  return NextResponse.json(tour);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const requiredFields = [
    'tourName',
    'destination',
    'departureDate',
    'returnDate',
    'totalSeats',
    'packagePrice',
    'childPrice',
    'pickupCity',
    'tourManager',
    'status',
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const returnDate = new Date(body.returnDate);
  const status = tourStatusForReturnDate(returnDate, body.status);

  const tour = await prisma.tour.update({
    where: { id },
    data: {
      tourName: body.tourName,
      destination: body.destination,
      departureDate: new Date(body.departureDate),
      returnDate,
      totalSeats: Number(body.totalSeats),
      packagePrice: Number(body.packagePrice),
      childPrice: Number(body.childPrice),
      pickupCity: body.pickupCity,
      tourManager: body.tourManager,
      status,
    },
    include: {
      bookings: { include: { members: true } },
    },
  });

  return NextResponse.json({
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
  });
}
