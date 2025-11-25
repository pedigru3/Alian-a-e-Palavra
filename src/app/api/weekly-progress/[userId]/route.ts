import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// GET /api/weekly-progress/[userId] - Get current week progress for user's couple
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coupleId: true }
    });

    if (!user?.coupleId) {
      return NextResponse.json({ error: 'User not in a couple' }, { status: 404 });
    }

    const { weekStart, weekEnd } = getWeekBoundaries();

    // Use findFirst with date range to avoid timestamp mismatch issues
    let progress = await prisma.weeklyProgress.findFirst({
      where: {
        coupleId: user.coupleId,
        weekStart: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000) // Same day
        }
      }
    });

    // If no progress exists for this week, create one with defaults
    if (!progress) {
      progress = await prisma.weeklyProgress.create({
        data: {
          coupleId: user.coupleId,
          weekStart,
          weekEnd,
          daysCompleted: 'false,false,false,false,false,false,false',
          spiritualGrowthXP: 0,
        }
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly progress' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coupleId: true }
    });

    if (!user?.coupleId) {
      return NextResponse.json({ error: 'User not in a couple' }, { status: 404 });
    }

    const body = await request.json();
    const { daysCompleted, spiritualGrowthXP } = body;
    const { weekStart, weekEnd } = getWeekBoundaries();
    
    // Find existing progress for this week
    const existing = await prisma.weeklyProgress.findFirst({
      where: {
        coupleId: user.coupleId,
        weekStart: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    let progress;
    if (existing) {
      progress = await prisma.weeklyProgress.update({
        where: { id: existing.id },
        data: { daysCompleted, spiritualGrowthXP }
      });
    } else {
      progress = await prisma.weeklyProgress.create({
        data: {
          coupleId: user.coupleId,
          weekStart,
          weekEnd,
          daysCompleted,
          spiritualGrowthXP
        }
      });
    }
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating weekly progress:', error);
    return NextResponse.json({ error: 'Failed to update weekly progress' }, { status: 500 });
  }
}
