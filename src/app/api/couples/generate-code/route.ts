import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid'; // For generating unique codes

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { couple: true } // Include couple to check if already connected
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.coupleId) {
      return NextResponse.json({ error: 'User is already part of a couple' }, { status: 409 });
    }

    let uniqueCode: string = '';
    let coupleExists = true;
    // Ensure code is unique
    while (coupleExists) {
      // Generate a more human-readable code
      const segment1 = Math.random().toString(36).substring(2, 5).toUpperCase();
      const segment2 = Math.random().toString(36).substring(2, 5).toUpperCase();
      const segment3 = Math.random().toString(36).substring(2, 5).toUpperCase();
      uniqueCode = `${segment1}-${segment2}-${segment3}`;

      const existingCouple = await prisma.couple.findUnique({
        where: { code: uniqueCode }
      });
      if (!existingCouple) {
        coupleExists = false;
      }
    }

    const newCouple = await prisma.couple.create({
      data: {
        code: uniqueCode,
        users: {
          connect: { id: user.id } // Connect the current user as the first user
        }
      }
    });

    // Update the user's coupleId
    await prisma.user.update({
      where: { id: user.id },
      data: { coupleId: newCouple.id }
    });
    
    // Invalidate SWR cache for the user to reflect new coupleId
    // This is handled by a direct mutate call in the client component

    return NextResponse.json({ code: uniqueCode, coupleId: newCouple.id }, { status: 201 });
  } catch (error) {
    console.error('Error generating couple code:', error);
    return NextResponse.json({ error: 'Failed to generate couple code' }, { status: 500 });
  }
}
