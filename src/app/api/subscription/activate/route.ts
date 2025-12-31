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

    // Find the user to check for coupleId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coupleId: true }
    });

    const userIdsToUpgrade = [userId];
    if (user?.coupleId) {
      const partner = await prisma.user.findFirst({
        where: {
          coupleId: user.coupleId,
          id: { not: userId }
        },
        select: { id: true }
      });
      if (partner) {
        userIdsToUpgrade.push(partner.id);
      }
    }

    // Create subscription and update users in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create subscriptions for all relevant users
      await Promise.all(userIdsToUpgrade.map(id => 
        tx.subscription.create({
          data: {
            userId: id,
            startDate,
            expiresAt,
          }
        })
      ));

      // Update isSubscription for all relevant users
      await tx.user.updateMany({
        where: { id: { in: userIdsToUpgrade } },
        data: {
          isSubscription: true,
        },
      });

      // Return the initiating user
      return await tx.user.findUnique({
        where: { id: userId },
        include: { couple: true }
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
