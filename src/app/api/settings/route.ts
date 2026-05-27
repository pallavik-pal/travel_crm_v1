import { getSettings } from '@/lib/records';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function POST(request: Request) {
  const body = await request.json();
  const current = await prisma.appSetting.findFirst();

  if (current) {
    await prisma.appSetting.update({
      where: { id: current.id },
      data: {
        organizationName: body.organizationName ?? current.organizationName,
        defaultCurrency: body.defaultCurrency ?? current.defaultCurrency,
        timezone: body.timezone ?? current.timezone,
        emailNotifications: Boolean(body.emailNotifications),
        smsAlerts: Boolean(body.smsAlerts),
        dailySummaryReport: Boolean(body.dailySummaryReport),
      },
    });
  } else {
    await prisma.appSetting.create({
      data: {
        organizationName: body.organizationName || 'Travel Adventures Inc.',
        defaultCurrency: body.defaultCurrency || 'INR',
        timezone: body.timezone || 'IST',
        emailNotifications: Boolean(body.emailNotifications),
        smsAlerts: Boolean(body.smsAlerts),
        dailySummaryReport: Boolean(body.dailySummaryReport),
      },
    });
  }

  return NextResponse.json(await getSettings());
}
