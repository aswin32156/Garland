import { NextResponse } from 'next/server';
import { generateMockSlots } from '@/lib/mock-data';
import { addDays, format } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    // Return next 7 days
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(new Date(), i + 1), 'yyyy-MM-dd')
    );
    const allSlots = dates.flatMap((d) => generateMockSlots(d));
    return NextResponse.json({ data: allSlots });
  }

  const slots = generateMockSlots(date);
  return NextResponse.json({ data: slots });
}
