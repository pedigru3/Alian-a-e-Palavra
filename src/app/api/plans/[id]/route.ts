import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/plans/[id]
// Get details of a specific plan
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const plan = await prisma.devotionalPlan.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' }
        },
        couple: {
          include: { users: true }
        }
      }
    });

    if (!plan) {
      return new NextResponse(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    // Check if at least one user in the couple is premium
    const isPremium = plan.couple?.users.some(u => u.isSubscription) ?? false;
    if (!isPremium) {
      return new NextResponse(JSON.stringify({ 
        error: 'PREMIUM_REQUIRED',
        message: 'Acesso aos detalhes do plano é um recurso exclusivo para membros Premium.'
      }), { status: 403 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error(`Error fetching plan ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// DELETE /api/plans/[id]
// Delete a specific plan
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await prisma.devotionalPlan.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting plan ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
