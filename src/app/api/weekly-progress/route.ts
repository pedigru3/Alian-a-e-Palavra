import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weekStart, daysCompleted, spiritualGrowthXP, userId } = body;
    
    const progress = await prisma.weeklyProgress.upsert({
      where: { userId },
      update: { weekStart, daysCompleted, spiritualGrowthXP },
      create: { weekStart, daysCompleted, spiritualGrowthXP, userId }
    });
    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly progress:', error);
    return NextResponse.json({ error: 'Failed to create weekly progress' }, { status: 500 });
  }
}
