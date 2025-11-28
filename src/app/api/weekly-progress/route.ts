import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalizedWeekBoundaries } from '@/lib/timezone';

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

    const { weekStart, weekEnd } = getLocalizedWeekBoundaries();
    
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
