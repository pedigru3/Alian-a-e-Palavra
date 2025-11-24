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
      return NextResponse.json(null); // No couple, no shared session
    }

    const coupleUserIds = user.couple.users.map(u => u.id);

    // 1. Find CURRENT USER's active session
    let activeSession = await prisma.devotionalSession.findFirst({
      where: {
        userId: user.id,
        status: { in: ['IN_PROGRESS', 'WAITING_PARTNER'] }
      },
      orderBy: { date: 'desc' },
      include: { user: true }
    });

    // 2. If not found, check if PARTNER has an active session to join
    if (!activeSession) {
        const partnerId = coupleUserIds.find(id => id !== user.id);
        if (partnerId) {
             const partnerSession = await prisma.devotionalSession.findFirst({
                where: {
                    userId: partnerId,
                    status: { in: ['IN_PROGRESS', 'WAITING_PARTNER'] }
                },
                orderBy: { date: 'desc' }
            });

            if (partnerSession) {
                // Create a MIRROR session for the current user
                activeSession = await prisma.devotionalSession.create({
                    data: {
                        userId: user.id,
                        scriptureReference: partnerSession.scriptureReference,
                        theme: partnerSession.theme,
                        culturalContext: partnerSession.culturalContext,
                        literaryContext: partnerSession.literaryContext,
                        christConnection: partnerSession.christConnection,
                        applicationQuestions: partnerSession.applicationQuestions,
                        status: 'IN_PROGRESS',
                        date: partnerSession.date // Keep same date/time roughly
                    },
                    include: { user: true }
                });
                
                // Also create an empty note for them so they are ready to go
                 await prisma.note.create({
                    data: {
                        content: '',
                        sessionId: activeSession.id,
                        userId: user.id
                    }
                });
            }
        }
    }

    // Self-Healing Logic:
    // If the active session found belongs to the current user and is WAITING_PARTNER,
    // check if the partner has actually finished (COMPLETED) a session for the same scripture.
    if (activeSession && activeSession.userId === user.id && activeSession.status === 'WAITING_PARTNER') {
        const partnerId = coupleUserIds.find(id => id !== user.id);
        if (partnerId) {
            const partnerSession = await prisma.devotionalSession.findFirst({
                where: {
                    userId: partnerId,
                    scriptureReference: activeSession.scriptureReference,
                    status: 'COMPLETED'
                },
                orderBy: { date: 'desc' }
            });

            if (partnerSession) {
                // Partner finished! Heal our status.
                activeSession = await prisma.devotionalSession.update({
                    where: { id: activeSession.id },
                    data: { status: 'COMPLETED' },
                    include: { user: true }
                });
                // Since it's now COMPLETED, it technically shouldn't be returned by the query above next time,
                // but for this request we return it so the UI can update to "Completed".
            }
        }
    }

    return NextResponse.json(activeSession);
  } catch (error) {
    console.error('Error fetching current session:', error);
    return NextResponse.json({ error: 'Failed to fetch current session' }, { status: 500 });
  }
}
