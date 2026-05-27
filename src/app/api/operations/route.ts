import { getOperationsTours } from '@/lib/records';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getOperationsTours());
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.tourId || !body.roomNumber || !body.capacity || !body.occupants) {
    return NextResponse.json(
      { error: 'Tour, room number, capacity, and occupants are required' },
      { status: 400 }
    );
  }

  await prisma.roomAllocation.create({
    data: {
      tourId: body.tourId,
      roomNumber: body.roomNumber,
      capacity: Number(body.capacity),
      occupants: body.occupants,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(await getOperationsTours(), { status: 201 });
}
