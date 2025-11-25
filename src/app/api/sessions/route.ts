import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBiblePassageText } from '@/services/bibleService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptureReference, theme, culturalContext, literaryContext, christConnection, applicationQuestions, userId, status } = body;
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
