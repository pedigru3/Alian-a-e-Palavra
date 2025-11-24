import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  try {
    // 1. Get current session details
    const currentSession = await prisma.devotionalSession.findUnique({
      where: { id: sessionId },
      include: { user: { include: { couple: { include: { users: true } } } } }
    });

    if (!currentSession) {
      return NextResponse.json([]);
    }

    const sessionIds = [sessionId];

    // 2. Find Partner's Session (if any)
    const couple = currentSession.user.couple;
    if (couple) {
      const partner = couple.users.find(u => u.id !== currentSession.userId);
      if (partner) {
        const partnerSession = await prisma.devotionalSession.findFirst({
          where: {
            userId: partner.id,
            scriptureReference: currentSession.scriptureReference,
            // We want the most recent one, likely the one matching this study
          },
          orderBy: { date: 'desc' }
        });

        if (partnerSession) {
          sessionIds.push(partnerSession.id);
        }
      }
    }

    // 3. Fetch notes for ALL identified sessions
    const notes = await prisma.note.findMany({
      where: { sessionId: { in: sessionIds } },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
