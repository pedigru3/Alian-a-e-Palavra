import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBiblePassageText } from '@/services/bibleService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      scriptureReference,
      theme,
      culturalContext,
      literaryContext,
      christConnection,
      applicationQuestions,
      userId,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { couple: { include: { users: true } } },
    });

    if (!user || !user.couple) {
      return NextResponse.json(
        { error: 'Usuário precisa estar em um casal para iniciar um devocional.' },
        { status: 400 }
      );
    }

    const coupleId = user.couple.id;

    const existingSession = await prisma.devotionalSession.findFirst({
      where: {
        coupleId,
        status: { in: ['IN_PROGRESS', 'WAITING_PARTNER'] },
      },
      orderBy: { date: 'desc' },
      include: {
        couple: { include: { users: true } },
        userProgress: { include: { user: true } },
      },
    });

    if (existingSession) {
      return NextResponse.json(
        {
          error: 'ACTIVE_SESSION_EXISTS',
          message: 'Já existe um devocional em andamento para este casal.',
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
        status: 'IN_PROGRESS',
        coupleId,
        initiatedByUserId: user.id,
        userProgress: {
          create: user.couple.users.map((coupleUser) => ({
            userId: coupleUser.id,
            status: 'IN_PROGRESS',
          })),
        },
        notes: {
          create: user.couple.users.map((coupleUser) => ({
            userId: coupleUser.id,
            content: '',
          })),
        },
      },
      include: {
        couple: { include: { users: true } },
        userProgress: { include: { user: true } },
        notes: { include: { user: true } },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
