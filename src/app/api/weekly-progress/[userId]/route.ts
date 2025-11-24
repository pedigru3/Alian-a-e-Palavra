import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    const progress = await prisma.weeklyProgress.findUnique({
      where: { userId },
    });
    if (progress) {
      return NextResponse.json(progress);
    } else {
      return NextResponse.json({ error: 'Weekly progress not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly progress' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    const body = await request.json();
    const { weekStart, daysCompleted, spiritualGrowthXP } = body;
    
    const progress = await prisma.weeklyProgress.update({
      where: { userId },
      data: { weekStart, daysCompleted, spiritualGrowthXP }
    });
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating weekly progress:', error);
    return NextResponse.json({ error: 'Failed to update weekly progress' }, { status: 500 });
  }
}
