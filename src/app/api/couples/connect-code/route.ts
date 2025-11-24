import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, code } = body;

    if (!userEmail || !code) {
      return NextResponse.json({ error: 'User email and code are required' }, { status: 400 });
    }

    // 1. Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { couple: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    if (currentUser.coupleId) {
      return NextResponse.json({ error: 'Current user is already part of a couple' }, { status: 409 });
    }

    // 2. Find the couple by code
    const couple = await prisma.couple.findUnique({
      where: { code: code },
      include: {
        users: true // Include existing users in the couple
      }
    });

    if (!couple) {
      return NextResponse.json({ error: 'Couple code not found' }, { status: 404 });
    }

    // 3. Check if the couple already has two users
    if (couple.users.length >= 2) {
      return NextResponse.json({ error: 'This couple already has two members' }, { status: 409 });
    }

    // 4. Ensure the current user isn't trying to connect with themselves or with an already connected user
    const existingUserInCouple = couple.users.find(u => u.id === currentUser.id);
    if (existingUserInCouple) {
        return NextResponse.json({ error: 'You are already connected to this couple' }, { status: 409 });
    }

    const partner = couple.users.find(u => u.id !== currentUser.id);

    // Connect current user to the couple
    await prisma.couple.update({
      where: { id: couple.id },
      data: {
        users: {
          connect: { id: currentUser.id }
        }
      }
    });

    // Update currentUser's coupleId and partnerName
    await prisma.user.update({
        where: { id: currentUser.id },
        data: { 
            coupleId: couple.id,
        }
    });
    
    // Update partner's coupleId and partnerName


    return NextResponse.json({ message: 'Successfully connected to couple', partnerEmail: partner?.email || 'N/A' }, { status: 200 });
  } catch (error) {
    console.error('Error connecting to couple:', error);
    return NextResponse.json({ error: 'Failed to connect to couple' }, { status: 500 });
  }
}

