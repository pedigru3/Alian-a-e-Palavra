import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Create subscription record
    const startDate = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year duration

    // Create subscription and update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.subscription.create({
        data: {
          userId,
          startDate,
          expiresAt,
        }
      });

      return await tx.user.update({
        where: { id: userId },
        data: {
          isSubscription: true,
        },
      });
    });

    console.log(`User ${userId} upgraded to premium (Plan: ${plan})`);

    return NextResponse.json({
      success: true,
      user: result,
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
  }
}
