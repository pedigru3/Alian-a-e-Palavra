import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_DAYS_COMPLETED = Array(7).fill('false').join(',');
const SAME_DAY_WINDOW_MS = 1000 * 60 * 60 * 24;

const normalizeDaysArray = (raw?: string | null) =>
  (raw ? raw.split(',') : Array(7).fill('false')).map((value) => value === 'true' || value === '1');

const serializeDaysArray = (days: boolean[]) => days.map((value) => (value ? 'true' : 'false')).join(',');

function getWeekBoundaries(date: Date = new Date()) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

async function markWeeklyProgressCompletion(coupleId: string) {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const { weekStart, weekEnd } = getWeekBoundaries();

  // Find existing progress for this week (using date range to avoid timestamp mismatch)
  let progress = await prisma.weeklyProgress.findFirst({
    where: {
      coupleId,
      weekStart: {
        gte: weekStart,
        lt: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000) // Same day
      }
    }
  });

  if (!progress) {
    progress = await prisma.weeklyProgress.create({
      data: {
        coupleId,
        weekStart,
        weekEnd,
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
    where: { id: progress.id },
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
    const { scriptureReference, theme, culturalContext, literaryContext, christConnection, applicationQuestions, status, scriptureText } = body;
    
    // 1. Fetch the current session to get userId and details
    const currentSession = await prisma.devotionalSession.findUnique({
      where: { id },
      include: { user: { include: { couple: { include: { users: true } } } } }
    });

    if (!currentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let newStatus = status;
    let shouldMarkProgress = false;

    // 2. If trying to complete, check partner's status
    const shouldAttemptCoupleSync = status === 'COMPLETED';

    if (shouldAttemptCoupleSync) {
      const couple = currentSession.user.couple;
      
      if (couple) {
        const partner = couple.users.find(u => u.id !== currentSession.userId);
        
        if (partner) {
          // Find partner's session for the same scripture/date (approx)
          const sessionDate = currentSession.date instanceof Date ? currentSession.date : new Date(currentSession.date);
          const minDate = new Date(sessionDate.getTime() - SAME_DAY_WINDOW_MS);
          const maxDate = new Date(sessionDate.getTime() + SAME_DAY_WINDOW_MS);

          const partnerSession = await prisma.devotionalSession.findFirst({
            where: {
              userId: partner.id,
              scriptureReference: currentSession.scriptureReference,
              date: {
                gte: minDate,
                lte: maxDate,
              },
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
             // Both completed now - mark progress!
             shouldMarkProgress = true;
          } else if (partnerSession.status === 'COMPLETED') {
             // Partner already completed - we're completing now
             shouldMarkProgress = true;
          }
        } else {
          // No partner yet, but user is in a couple - still mark progress
          shouldMarkProgress = true;
        }
      } else {
        // User not in a couple - shouldn't happen but handle gracefully
        shouldMarkProgress = false;
      }
    }

    const dataToUpdate: Record<string, unknown> = {
      scriptureReference,
      theme,
      culturalContext,
      literaryContext,
      christConnection,
      applicationQuestions,
      status: newStatus,
    };

    if (scriptureText !== undefined) {
      dataToUpdate.scriptureText = scriptureText;
    }

    const session = await prisma.devotionalSession.update({
      where: { id },
      data: dataToUpdate,
    });

    // Mark weekly progress when both partners complete (or solo completion for incomplete couples)
    if (shouldMarkProgress && currentSession.user.coupleId) {
      await markWeeklyProgressCompletion(currentSession.user.coupleId);
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}


