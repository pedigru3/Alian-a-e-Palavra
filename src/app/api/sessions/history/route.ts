import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { couple: { include: { users: true } } }
    });

    if (!user || !user.couple) {
      return NextResponse.json([]);
    }

    const coupleUserIds = user.couple.users.map(u => u.id);

    // Fetch completed sessions for the couple
    const history = await prisma.devotionalSession.findMany({
      where: {
        userId: { in: coupleUserIds },
        status: 'COMPLETED'
      },
      orderBy: { date: 'desc' },
      include: { user: true }
    });

    const seenKeys = new Set<string>();
    const uniqueHistory = history.filter(session => {
      const key = `${session.scriptureReference}-${new Date(session.date).toDateString()}`;
      if (seenKeys.has(key)) {
        return false;
      }
      seenKeys.add(key);
      return true;
    });

    return NextResponse.json(uniqueHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
