import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const DEFAULT_CATEGORIES = ['DMC', 'Flights', 'Bus', 'Train', 'Chef'];

const toAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount) : NaN;
};

const getCategories = async (tourId: string) => {
  const existingCategories = await prisma.operationsPaymentCategory.findMany({
    where: { tourId },
    include: {
      paymentLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const legacyFlight = existingCategories.find(
    (category) => category.categoryName === 'Flight'
  );

  if (
    legacyFlight &&
    !existingCategories.some((category) => category.categoryName === 'Flights')
  ) {
    await prisma.operationsPaymentCategory.update({
      where: { id: legacyFlight.id },
      data: { categoryName: 'Flights' },
    });

    return getCategories(tourId);
  }

  const existingNames = new Set(
    existingCategories.map((category) => category.categoryName)
  );
  const missingCategories = DEFAULT_CATEGORIES.filter((category) => !existingNames.has(category));

  if (missingCategories.length) {
    await Promise.all(
      missingCategories.map((categoryName) =>
        prisma.operationsPaymentCategory.create({
          data: {
            tourId,
            categoryName,
            totalAmount: 0,
          },
        })
      )
    );

    return prisma.operationsPaymentCategory.findMany({
      where: { tourId },
      include: {
        paymentLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  return existingCategories;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tourId = searchParams.get('tourId');

  if (!tourId) {
    const tours = await prisma.tour.findMany({
      orderBy: { departureDate: 'asc' },
      select: {
        id: true,
        tourName: true,
        departureDate: true,
      },
    });

    return NextResponse.json({
      tours: tours.map((tour) => ({
        id: tour.id,
        name: `${tour.tourName} (${tour.departureDate.toLocaleDateString()})`,
      })),
    });
  }

  const categories = await getCategories(tourId);

  return NextResponse.json(
    categories
      .sort(
        (first, second) =>
          DEFAULT_CATEGORIES.indexOf(first.categoryName) -
          DEFAULT_CATEGORIES.indexOf(second.categoryName)
      )
      .map((category) => {
        const totalPaid = category.paymentLogs.reduce(
          (sum, log) => sum + log.amountPaid,
          0
        );

        return {
          id: category.id,
          categoryName: category.categoryName,
          totalAmount: category.totalAmount,
          totalPaid,
          amountYetToPay: Math.max(category.totalAmount - totalPaid, 0),
          logs: category.paymentLogs.map((log) => ({
            id: log.id,
            amountPaid: log.amountPaid,
            utrNumber: log.utrNumber,
            createdAt: log.createdAt,
          })),
        };
      })
  );
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === 'set-total') {
    const totalAmount = toAmount(body.totalAmount);

    if (!body.categoryId || Number.isNaN(totalAmount) || totalAmount < 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.operationsPaymentCategory.update({
      where: { id: body.categoryId },
      data: {
        totalAmount,
      },
    });

    return NextResponse.json(updated);
  }

  if (body.action === 'add-payment') {
    const amountPaid = toAmount(body.amountPaid);
    const utrNumber = String(body.utrNumber || '').trim();

    if (!body.categoryId || !utrNumber || Number.isNaN(amountPaid) || amountPaid <= 0) {
      return NextResponse.json(
        { error: 'Valid amount and UTR are required' },
        { status: 400 }
      );
    }

    const category = await prisma.operationsPaymentCategory.findUnique({
      where: { id: body.categoryId },
      include: { paymentLogs: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Payment category was not found' },
        { status: 404 }
      );
    }

    const totalPaid = category.paymentLogs.reduce(
      (sum, log) => sum + log.amountPaid,
      0
    );
    const amountYetToPay = category.totalAmount - totalPaid;

    if (category.totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Set the total amount before adding payments' },
        { status: 400 }
      );
    }

    if (amountPaid > amountYetToPay) {
      return NextResponse.json(
        { error: 'Payment amount cannot be more than the remaining balance' },
        { status: 400 }
      );
    }

    const log = await prisma.operationsPaymentLog.create({
      data: {
        categoryId: body.categoryId,
        amountPaid,
        utrNumber,
      },
    });

    return NextResponse.json(log);
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}
