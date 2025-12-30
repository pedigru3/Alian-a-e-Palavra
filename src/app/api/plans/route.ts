import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDevotionalPlan } from '@/services/geminiService';

// GET /api/plans
// List user's couple plans
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coupleId = searchParams.get('coupleId');

  if (!coupleId) {
    return new NextResponse(JSON.stringify({ error: 'coupleId is required' }), { status: 400 });
  }

  try {
    // Check if at least one user in the couple is premium (valid subscription)
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      include: { 
        users: {
          include: { subscriptions: true }
        }
      }
    });

    const isPremium = couple?.users.some(u => 
      u.subscriptions.some(sub => new Date(sub.expiresAt) > new Date())
    ) ?? false;

    if (!isPremium) {
      return new NextResponse(JSON.stringify({ 
        error: 'PREMIUM_REQUIRED',
        message: 'Acesso aos planos de devocional é um recurso exclusivo para membros Premium.'
      }), { status: 403 });
    }

    const plans = await prisma.devotionalPlan.findMany({
      where: { coupleId },
      include: {
        days: {
          include: {
            devotionalSessions: {
              select: {
                id: true,
                status: true
              }
            }
          },
          orderBy: { dayNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// POST /api/plans
// Generate and create a new plan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coupleId, description, duration } = body;

    if (!coupleId || !description || !duration) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if at least one user in the couple is premium (valid subscription)
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      include: { 
        users: {
          include: { subscriptions: true }
        }
      }
    });

    const isPremium = couple?.users.some(u => 
      u.subscriptions.some(sub => new Date(sub.expiresAt) > new Date())
    ) ?? false;

    if (!isPremium) {
      return new NextResponse(JSON.stringify({ 
        error: 'PREMIUM_REQUIRED',
        message: 'Criação de planos de devocional é um recurso exclusivo para membros Premium.'
      }), { status: 403 });
    }

    // 1. Generate Plan Structure using AI
    const generatedPlan = await generateDevotionalPlan(description, duration);

    // 2. Save to Database
    const newPlan = await prisma.devotionalPlan.create({
      data: {
        coupleId,
        title: generatedPlan.title,
        description: description,
        duration: duration,
        days: {
          create: generatedPlan.days.map(day => ({
            dayNumber: day.day,
            title: day.title,
            theme: day.theme,
            scriptureReference: day.scripture,
            isCompleted: false
          }))
        }
      },
      include: {
        days: {
          include: {
            devotionalSessions: true
          }
        }
      }
    });

    return NextResponse.json(newPlan);
  } catch (error) {
    console.error('Error creating plan:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
