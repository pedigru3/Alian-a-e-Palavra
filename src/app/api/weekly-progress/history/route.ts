import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { coupleId: true }
    });

    if (!user?.coupleId) {
      return NextResponse.json([]);
    }

    const history = await prisma.weeklyProgress.findMany({
      where: { coupleId: user.coupleId },
      orderBy: { weekStart: 'desc' },
      take: 12, // Last 12 weeks
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching weekly progress history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

