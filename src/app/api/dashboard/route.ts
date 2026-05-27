import { getDashboard } from '@/lib/records';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await getDashboard());
}
