import { getTours } from '@/lib/records';
import { generateTourCode } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getTours());
}

export async function POST(request: Request) {
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
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const tour = await prisma.tour.create({
    data: {
      tourName: body.tourName,
      tourCode: generateTourCode(),
      destination: body.destination,
      departureDate: new Date(body.departureDate),
      returnDate: new Date(body.returnDate),
      totalSeats: Number(body.totalSeats),
      packagePrice: Number(body.packagePrice),
      childPrice: Number(body.childPrice),
      pickupCity: body.pickupCity,
      tourManager: body.tourManager,
      status: body.status ?? 'draft',
      costEstimate: Number(body.costEstimate ?? 0),
    },
    include: {
      bookings: true,
    },
  });

  return NextResponse.json(
    {
      id: tour.id,
      tourName: tour.tourName,
      tourCode: tour.tourCode,
      destination: tour.destination,
      departureDate: tour.departureDate.toISOString(),
      returnDate: tour.returnDate.toISOString(),
      totalSeats: tour.totalSeats,
      occupiedSeats: tour.bookings.length,
      packagePrice: tour.packagePrice,
      childPrice: tour.childPrice || tour.packagePrice,
      pickupCity: tour.pickupCity,
      tourManager: tour.tourManager,
      status: tour.status,
    },
    { status: 201 }
  );
}
