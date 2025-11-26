import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  try {
    const notes = await prisma.note.findMany({
      where: { sessionId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
