import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obter uma subscription específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

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

    // Busca a subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Verifica se a subscription pertence ao usuário autenticado
    if (subscription.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// PUT - Atualizar uma subscription
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

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

    // Verifica se a subscription existe e pertence ao usuário
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (existingSubscription.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, expiresAt } = body;

    // Valida as datas se fornecidas
    let start: Date | undefined;
    let expires: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 });
      }
    }

    if (expiresAt) {
      expires = new Date(expiresAt);
      if (isNaN(expires.getTime())) {
        return NextResponse.json({ error: 'Invalid expiresAt format' }, { status: 400 });
      }
    }

    // Valida se expiresAt é depois de startDate
    const finalStart = start || existingSubscription.startDate;
    const finalExpires = expires || existingSubscription.expiresAt;

    if (finalExpires <= finalStart) {
      return NextResponse.json({ error: 'expiresAt must be after startDate' }, { status: 400 });
    }

    // Atualiza a subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(startDate && { startDate: start }),
        ...(expiresAt && { expiresAt: expires }),
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// DELETE - Deletar uma subscription
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

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

    // Verifica se a subscription existe e pertence ao usuário
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (existingSubscription.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Deleta a subscription
    await prisma.subscription.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}

