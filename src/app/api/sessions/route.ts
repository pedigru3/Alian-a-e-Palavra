import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBiblePassageText } from '@/services/bibleService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptureReference, theme, culturalContext, literaryContext, christConnection, applicationQuestions, userId, status } = body;

    // Ensure the user doesn't already have an active session
    const existingSession = await prisma.devotionalSession.findFirst({
      where: {
        userId,
        status: { in: ['IN_PROGRESS', 'WAITING_PARTNER'] },
      },
      orderBy: { date: 'desc' },
    });

    if (existingSession) {
      return NextResponse.json(
        {
          error: 'ACTIVE_SESSION_EXISTS',
          message: 'Já existe um devocional em andamento para este usuário.',
          session: existingSession,
        },
        { status: 409 }
      );
    }

    const scriptureText = await fetchBiblePassageText(scriptureReference);
    
    const session = await prisma.devotionalSession.create({
      data: {
        scriptureReference,
        theme,
        culturalContext,
        literaryContext,
        christConnection,
        applicationQuestions,
        scriptureText: scriptureText ?? null,
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
