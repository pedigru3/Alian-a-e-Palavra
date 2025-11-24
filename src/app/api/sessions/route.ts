import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptureReference, theme, culturalContext, literaryContext, christConnection, applicationQuestions, userId, status } = body;
    
    const session = await prisma.devotionalSession.create({
      data: {
        scriptureReference,
        theme,
        culturalContext,
        literaryContext,
        christConnection,
        applicationQuestions,
        status,
        userId,
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
