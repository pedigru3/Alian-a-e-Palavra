import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { couple: { include: { users: true } } },
    });

    if (!user || !user.couple) {
      return NextResponse.json(null);
    }

    const activeSession = await prisma.devotionalSession.findFirst({
      where: {
        coupleId: user.couple.id,
        status: { in: ['IN_PROGRESS', 'WAITING_PARTNER'] },
      },
      orderBy: { date: 'desc' },
      include: {
        template: true,
        couple: { include: { users: true } },
        userProgress: { include: { user: true } },
        notes: { include: { user: true } },
      },
    });

    if (!activeSession) return NextResponse.json(null);

    // Decrypt notes in memory
    if (activeSession.notes && user.couple.encryptionKey) {
       // Import decryptNote at top of file
       const { decryptNote } = await import('@/lib/encryption');
       
       const decryptedNotes = activeSession.notes.map(note => {
         try {
           if (!note.content) return note;
           return {
             ...note,
             content: decryptNote(note.content, user.couple!.encryptionKey!)
           };
         } catch (e) {
           console.error('Error decrypting note', e);
           return note;
         }
       });
       
       return NextResponse.json({ ...activeSession, notes: decryptedNotes });
    }

    return NextResponse.json(activeSession);
  } catch (error) {
    console.error('Error fetching current session:', error);
    return NextResponse.json({ error: 'Failed to fetch current session' }, { status: 500 });
  }
}

