import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DEFAULT_DAYS_COMPLETED = Array(7).fill('false').join(',');

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

  let progress = await prisma.weeklyProgress.findFirst({
    where: {
      coupleId,
      weekStart: {
        gte: weekStart,
        lt: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000),
      },
    },
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
      include: {
        couple: { include: { users: true } },
        userProgress: { include: { user: true } },
        notes: { include: { user: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const authedSession = await getServerSession(authOptions);
  if (!authedSession || !authedSession.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: authedSession.user.email },
      include: { couple: true },
    });

    if (!currentUser || !currentUser.coupleId) {
      return NextResponse.json({ error: 'User must belong to a couple to update sessions.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      scriptureReference,
      theme,
      culturalContext,
      literaryContext,
      christConnection,
      applicationQuestions,
      status,
      scriptureText,
    } = body;

    const sessionRecord = await prisma.devotionalSession.findUnique({
      where: { id },
      include: {
        couple: true,
        userProgress: true,
      },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionRecord.coupleId !== currentUser.coupleId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const progressEntry = sessionRecord.userProgress.find((progress) => progress.userId === currentUser.id);
    if (!progressEntry) {
      return NextResponse.json({ error: 'User progress not found for this session' }, { status: 403 });
    }

    const sessionUpdateData: Record<string, unknown> = {};
    if (scriptureReference !== undefined) sessionUpdateData.scriptureReference = scriptureReference;
    if (theme !== undefined) sessionUpdateData.theme = theme;
    if (culturalContext !== undefined) sessionUpdateData.culturalContext = culturalContext;
    if (literaryContext !== undefined) sessionUpdateData.literaryContext = literaryContext;
    if (christConnection !== undefined) sessionUpdateData.christConnection = christConnection;
    if (applicationQuestions !== undefined) sessionUpdateData.applicationQuestions = applicationQuestions;
    if (scriptureText !== undefined) sessionUpdateData.scriptureText = scriptureText;

    let userCompleted = false;
    if (status === 'COMPLETED' && progressEntry.status !== 'COMPLETED') {
      await prisma.devotionalSessionUserProgress.update({
        where: { sessionId_userId: { sessionId: id, userId: currentUser.id } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      userCompleted = true;
    }

    const updatedProgress = await prisma.devotionalSessionUserProgress.findMany({
      where: { sessionId: id },
    });

    const totalUsers = updatedProgress.length;
    const completedCount = updatedProgress.filter((progress) => progress.status === 'COMPLETED').length;

    let aggregateStatus: 'IN_PROGRESS' | 'WAITING_PARTNER' | 'COMPLETED' = 'IN_PROGRESS';
    if (completedCount === 0) {
      aggregateStatus = 'IN_PROGRESS';
    } else if (completedCount < totalUsers) {
      aggregateStatus = 'WAITING_PARTNER';
    } else {
      aggregateStatus = 'COMPLETED';
    }

    if (sessionRecord.status !== aggregateStatus) {
      sessionUpdateData.status = aggregateStatus;
    }

    if (Object.keys(sessionUpdateData).length > 0) {
      await prisma.devotionalSession.update({
        where: { id },
        data: sessionUpdateData,
      });
    }

    if (aggregateStatus === 'COMPLETED' && userCompleted) {
      await markWeeklyProgressCompletion(sessionRecord.coupleId);
    }

    const updatedSession = await prisma.devotionalSession.findUnique({
      where: { id },
      include: {
        couple: { include: { users: true } },
        userProgress: { include: { user: true } },
        notes: { include: { user: true } },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const authedSession = await getServerSession(authOptions);
  if (!authedSession || !authedSession.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: authedSession.user.email },
      include: { couple: true },
    });

    if (!currentUser || !currentUser.coupleId) {
      return NextResponse.json({ error: 'User must belong to a couple.' }, { status: 403 });
    }

    const sessionRecord = await prisma.devotionalSession.findUnique({
      where: { id },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionRecord.coupleId !== currentUser.coupleId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.devotionalSessionUserProgress.deleteMany({
        where: { sessionId: id },
      }),
      prisma.note.deleteMany({
        where: { sessionId: id },
      }),
      prisma.devotionalSession.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
