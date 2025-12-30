import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateDevotionalContent, generateDevotionalContentPremium } from '@/services/geminiService';
import { prisma } from '@/lib/prisma';
import { isSameLocalizedDay } from '@/lib/timezone';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { scripture, theme } = await request.json();

    if (!scripture) {
      return NextResponse.json({ error: 'Scripture reference is required' }, { status: 400 });
    }

    // 1. Fetch user and check premium status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        couple: true,
        subscriptions: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPremium = user.subscriptions.some(
      (sub) => new Date(sub.expiresAt) > new Date()
    );

    // 2. DAILY LIMIT CHECK (Only for non-premium)
    if (!isPremium && user.coupleId) {
      const now = new Date();
      const couple = await prisma.couple.findUnique({
        where: { id: user.coupleId },
        select: { lastGeneratedAt: true }
      });

      if (couple?.lastGeneratedAt && isSameLocalizedDay(new Date(couple.lastGeneratedAt), now)) {
        return NextResponse.json(
          {
            error: 'ALREADY_GENERATED_TODAY',
            message: 'Você já gerou um devocional hoje. Tente novamente amanhã.',
          },
          { status: 429 }
        );
      }
    }

    // 3. EXISTING TEMPLATE CHECK (Saves cost for all users)
    const existingTemplate = await prisma.devotionalTemplate.findUnique({
      where: { scriptureReference: scripture }
    });

    if (existingTemplate) {
      console.log(`Using existing template for: ${scripture}`);
      
      // If user is premium, ensure we have the premium fields, if not, we might need to "upgrade" the template
      // But for now, let's just return what we have to be efficient
      return NextResponse.json({
        scriptureReference: existingTemplate.scriptureReference,
        theme: existingTemplate.theme,
        culturalContext: existingTemplate.culturalContext,
        literaryContext: existingTemplate.literaryContext,
        christConnection: existingTemplate.christConnection,
        questions: JSON.parse(existingTemplate.applicationQuestions),
        centralTruth: existingTemplate.centralTruth,
        keyGreekHebrewTerms: existingTemplate.keyGreekHebrewTerms,
        comments: existingTemplate.comments,
        isPremium
      });
    }

    // 4. GENERATE WITH AI (Only if needed)
    let content;
    if (isPremium) {
      content = await generateDevotionalContentPremium(scripture, theme);
    } else {
      content = await generateDevotionalContent(scripture, theme);
    }

    return NextResponse.json({ ...content, isPremium });
  } catch (error) {
    console.error('Error generating AI content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
