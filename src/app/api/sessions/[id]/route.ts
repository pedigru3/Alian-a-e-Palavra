import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLocalizedTodayIndex, getLocalizedWeekBoundaries } from '@/lib/timezone';
import { notifyPartnerCompletion } from '@/lib/notifications';

const DEFAULT_DAYS_COMPLETED = Array(7).fill('false').join(',');

const normalizeDaysArray = (raw?: string | null) =>
  (raw ? raw.split(',') : Array(7).fill('false')).map((value) => value === 'true' || value === '1');

const serializeDaysArray = (days: boolean[]) => days.map((value) => (value ? 'true' : 'false')).join(',');

async function markWeeklyProgressCompletion(coupleId: string) {
  const todayIndex = getLocalizedTodayIndex();
  const { weekStart, weekEnd } = getLocalizedWeekBoundaries();

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

  if (!daysCompletedArray[todayIndex]) {
    daysCompletedArray[todayIndex] = true;
  }

  await prisma.weeklyProgress.update({
    where: { id: progress.id },
    data: {
      daysCompleted: serializeDaysArray(daysCompletedArray),
    },
  });
}

// Calcula XP necessário para o próximo nível: 20 * level
function getXpForLevel(level: number): number {
  return 20 * level;
}

// Adiciona XP ao casal e calcula level up
async function addXpToCouple(coupleId: string, xpGained: number): Promise<{
  previousLevel: number;
  previousXp: number;
  newLevel: number;
  newXp: number;
  leveledUp: boolean;
  xpGained: number;
}> {
  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
  });

  if (!couple) {
    throw new Error('Couple not found');
  }

  const previousLevel = couple.level;
  const previousXp = couple.xp;
  
  let currentLevel = couple.level;
  let currentXp = couple.xp + xpGained;
  let leveledUp = false;

  // Verifica se subiu de nível (pode subir múltiplos níveis de uma vez)
  let xpNeeded = getXpForLevel(currentLevel);
  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    currentLevel++;
    leveledUp = true;
    xpNeeded = getXpForLevel(currentLevel);
  }

  await prisma.couple.update({
    where: { id: coupleId },
    data: {
      level: currentLevel,
      xp: currentXp,
    },
  });

  return {
    previousLevel,
    previousXp,
    newLevel: currentLevel,
    newXp: currentXp,
    leveledUp,
    xpGained,
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await prisma.devotionalSession.findUnique({
      where: { id },
      include: {
        template: true,
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
    const { status } = body;

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

      // Se o usuário atual terminou e o parceiro ainda não, notifica o parceiro
      if (userCompleted && aggregateStatus === 'WAITING_PARTNER') {
        await notifyPartnerCompletion(id, currentUser.id);
      }
    }

    let xpResult = null;
    
    // Quando o devocional é COMPLETADO (ambos terminaram), adiciona XP
    if (aggregateStatus === 'COMPLETED' && sessionRecord.status !== 'COMPLETED') {
      await markWeeklyProgressCompletion(sessionRecord.coupleId);
      xpResult = await addXpToCouple(sessionRecord.coupleId, 10);

      // Se a sessão estiver vinculada a um dia de um plano, marca o dia como concluído
      if (sessionRecord.planDayId) {
        await prisma.planDay.update({
          where: { id: sessionRecord.planDayId },
          data: { isCompleted: true },
        });
      }
    }

    const updatedSession = await prisma.devotionalSession.findUnique({
      where: { id },
      include: {
        template: true,
        couple: { include: { users: true } },
        userProgress: { include: { user: true } },
        notes: { include: { user: true } },
      },
    });

    return NextResponse.json({
      ...updatedSession,
      xpResult,
    });
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
