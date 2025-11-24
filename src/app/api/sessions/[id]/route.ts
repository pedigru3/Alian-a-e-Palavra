import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_DAYS_COMPLETED = Array(7).fill('false').join(',');

const normalizeDaysArray = (raw?: string | null) =>
  (raw ? raw.split(',') : Array(7).fill('false')).map((value) => value === 'true' || value === '1');

const serializeDaysArray = (days: boolean[]) => days.map((value) => (value ? 'true' : 'false')).join(',');

async function markWeeklyProgressCompletion(userId: string) {
  const todayIndex = (new Date().getDay() + 6) % 7;

  let progress = await prisma.weeklyProgress.findUnique({ where: { userId } });

  if (!progress) {
    progress = await prisma.weeklyProgress.create({
      data: {
        userId,
        weekStart: new Date(),
        daysCompleted: DEFAULT_DAYS_COMPLETED,
        spiritualGrowthXP: 0,
      },
    });
  }

  const daysCompletedArray = normalizeDaysArray(progress.daysCompleted);
  let newXP = progress.spiritualGrowthXP ?? 0;

  if (!daysCompletedArray[todayIndex]) {
    daysCompletedArray[todayIndex] = true;
    newXP = Math.min(100, newXP + 15);
  }

  await prisma.weeklyProgress.update({
    where: { userId },
    data: {
      daysCompleted: serializeDaysArray(daysCompletedArray),
      spiritualGrowthXP: newXP,
    },
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await prisma.devotionalSession.findUnique({
      where: { id },
      include: { notes: true }
    });
    if (session) {
      return NextResponse.json(session);
    } else {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await request.json();
    const { scriptureReference, theme, culturalContext, literaryContext, christConnection, applicationQuestions, status } = body;
    
    // 1. Fetch the current session to get userId and details
    const currentSession = await prisma.devotionalSession.findUnique({
      where: { id },
      include: { user: { include: { couple: { include: { users: true } } } } }
    });

    if (!currentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let newStatus = status;

    // 2. If trying to complete, check partner's status
    const shouldAttemptCoupleSync = status === 'COMPLETED';
    const progressUserIds: string[] = [];

    if (shouldAttemptCoupleSync) {
      const couple = currentSession.user.couple;
      
      if (couple) {
        const partner = couple.users.find(u => u.id !== currentSession.userId);
        
        if (partner) {
          // Find partner's session for the same scripture/date (approx)
          // Ideally we should link sessions, but for now matching by scriptureReference and recent date is a good proxy
          // Or simpler: find the most recent session for the partner
           const partnerSession = await prisma.devotionalSession.findFirst({
            where: {
              userId: partner.id,
              scriptureReference: currentSession.scriptureReference, // Match by scripture
              // You might want to add a date check here too, e.g., created within the last 24h
            },
            orderBy: { date: 'desc' }
          });

          if (!partnerSession || (partnerSession.status !== 'COMPLETED' && partnerSession.status !== 'WAITING_PARTNER')) {
            // Partner hasn't finished yet
            newStatus = 'WAITING_PARTNER';
          } else if (partnerSession.status === 'WAITING_PARTNER') {
             // Partner is waiting for us! Update partner to COMPLETED too
             await prisma.devotionalSession.update({
               where: { id: partnerSession.id },
               data: { status: 'COMPLETED' }
             });
             // We are also COMPLETED (default)
              progressUserIds.push(currentSession.userId, partner.id);
          } else if (partnerSession.status === 'COMPLETED') {
              progressUserIds.push(currentSession.userId, partner.id);
          }
        }
        else {
          // Partner has not joined yet; treat as solo completion so the user is not blocked indefinitely
          progressUserIds.push(currentSession.userId);
        }
      } else {
        // Single users should still have their progress updated when they complete so the dashboard stays in sync
        progressUserIds.push(currentSession.userId);
      }
    }

    const session = await prisma.devotionalSession.update({
      where: { id },
      data: {
        scriptureReference,
        theme,
        culturalContext,
        literaryContext,
        christConnection,
        applicationQuestions,
        status: newStatus,
      },
    });

    if (status === 'COMPLETED' && newStatus === 'COMPLETED' && progressUserIds.length > 0) {
      const uniqueUserIds = Array.from(new Set(progressUserIds));
      await Promise.all(uniqueUserIds.map(markWeeklyProgressCompletion));
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

