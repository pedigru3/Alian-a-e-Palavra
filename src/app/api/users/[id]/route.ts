import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET a single user by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        couple: {
          include: {
            users: {
              include: {
                subscriptions: true
              }
            }
          }
        },
        subscriptions: true // Include subscriptions to check validity
      }
    });

    if (user) {
      // Exclude sensitive fields from the main user object
      const { password: _p, pushToken: _pt, verificationToken: _vt, ...userSafe } = user;

      // Compute isSubscription dynamically
      const allSubscriptions = [
        ...user.subscriptions,
        ...(user.couple?.users.flatMap(u => u.subscriptions) || [])
      ];

      const hasActiveSubscription = allSubscriptions.some(
        (sub) => new Date(sub.expiresAt) > new Date()
      );
      
      const latestSubscription = allSubscriptions.sort(
        (a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
      )[0];

      // Sanitize couple users if they exist
      let safeCouple: any = null;
      if (userSafe.couple) {
        const { encryptionKey: _ek, ...coupleBase } = userSafe.couple;
        safeCouple = {
          ...coupleBase,
          users: userSafe.couple.users?.map(u => {
            const { password: __p, pushToken: __pt, verificationToken: __vt, ...uSafe } = u;
            return uSafe;
          })
        };
      }

      // Return sanitized user with computed fields
      return NextResponse.json({
        ...userSafe,
        couple: safeCouple,
        isSubscription: hasActiveSubscription,
        subscriptionExpiresAt: latestSubscription?.expiresAt || null
      });
    } else {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// UPDATE a user by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await request.json();
    const { name, email, coupleId } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        coupleId,
      },
    });

    // Exclude sensitive fields from response
    const { password: _p, pushToken: _pt, verificationToken: _vt, ...updatedUserSafe } = updatedUser;

    return NextResponse.json(updatedUserSafe);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// DELETE a user by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await prisma.user.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}