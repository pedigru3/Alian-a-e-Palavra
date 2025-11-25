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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { daysCompleted, spiritualGrowthXP, userId } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coupleId: true }
    });

    if (!user?.coupleId) {
      return NextResponse.json({ error: 'User not in a couple' }, { status: 400 });
    }

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

    // If already exists, just return it - don't overwrite!
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // Only create if doesn't exist
    const progress = await prisma.weeklyProgress.create({
      data: {
        coupleId: user.coupleId,
        weekStart,
        weekEnd,
        daysCompleted: daysCompleted || 'false,false,false,false,false,false,false',
        spiritualGrowthXP: spiritualGrowthXP || 0
      }
    });
    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly progress:', error);
    return NextResponse.json({ error: 'Failed to create weekly progress' }, { status: 500 });
  }
}
