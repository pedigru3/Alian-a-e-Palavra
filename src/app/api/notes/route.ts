import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, sessionId, userId } = body;
    
    const note = await prisma.note.create({
      data: { content, sessionId, userId }
    });
    // Note: Broadcasting is handled by the separate WS server or client-side logic now
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
