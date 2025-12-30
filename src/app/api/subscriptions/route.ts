import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Listar todas as subscriptions do usuário autenticado
export async function GET(request: Request) {
  try {
    const authedSession = await getServerSession(authOptions);
    if (!authedSession || !authedSession.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Busca o usuário autenticado
    const user = await prisma.user.findUnique({
      where: { email: authedSession.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Busca todas as subscriptions do usuário
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST - Criar uma nova subscription
export async function POST(request: Request) {
  try {
    const authedSession = await getServerSession(authOptions);
    if (!authedSession || !authedSession.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, expiresAt } = body;

    if (!startDate || !expiresAt) {
      return NextResponse.json({ error: 'Missing required fields: startDate and expiresAt' }, { status: 400 });
    }

    // Valida se as datas são válidas
    const start = new Date(startDate);
    const expires = new Date(expiresAt);

    if (isNaN(start.getTime()) || isNaN(expires.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (expires <= start) {
      return NextResponse.json({ error: 'expiresAt must be after startDate' }, { status: 400 });
    }

    // Busca o usuário autenticado
    const user = await prisma.user.findUnique({
      where: { email: authedSession.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cria a subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        startDate: start,
        expiresAt: expires,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

