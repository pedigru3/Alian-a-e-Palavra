import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBiblePassageText } from '@/services/bibleService';
import { isSameLocalizedDay } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

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

    // Verificar se já existe sessão ativa
    const existingSession = await prisma.devotionalSession.findFirst({
      where: {
        coupleId,
        status: { in: ['IN_PROGRESS', 'WAITING_PARTNER'] },
      },
      orderBy: { date: 'desc' },
      include: {
        template: true,
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

    // Verificar se já gerou devocional hoje usando transação com lock para evitar race condition
    const now = new Date();

    // Usar transação com SELECT FOR UPDATE para evitar race condition
    const canGenerate = await prisma.$transaction(async (tx) => {
      // Lock o registro do casal para evitar race condition
      const couple = await tx.couple.findUnique({
        where: { id: coupleId },
        select: { lastGeneratedAt: true },
      });

      if (!couple) {
        throw new Error('Casal não encontrado');
      }

      // Verifica se já gerou hoje
      if (couple.lastGeneratedAt) {
        if (isSameLocalizedDay(new Date(couple.lastGeneratedAt), now)) {
          return false; // Já gerou hoje
        }
      }

      // Atualiza lastGeneratedAt para hoje
      await tx.couple.update({
        where: { id: coupleId },
        data: { lastGeneratedAt: now },
      });

      return true; // Pode gerar
    });

    if (!canGenerate) {
      return NextResponse.json(
        {
          error: 'ALREADY_GENERATED_TODAY',
          message: 'Você já gerou um devocional hoje. Tente novamente amanhã.',
        },
        { status: 429 }
      );
    }

    // Check if template already exists for this scripture reference
    let template = await prisma.devotionalTemplate.findUnique({
      where: { scriptureReference },
    });

    // If not, create the template
    if (!template) {
      const scriptureText = await fetchBiblePassageText(scriptureReference);

      template = await prisma.devotionalTemplate.create({
        data: {
          scriptureReference,
          theme,
          culturalContext,
          literaryContext,
          christConnection,
          applicationQuestions,
          scriptureText: scriptureText ?? null,
          isAiGenerated: true,
        },
      });
    }

    // Create session linked to template
    const session = await prisma.devotionalSession.create({
      data: {
        status: 'IN_PROGRESS',
        templateId: template.id,
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
        template: true,
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
