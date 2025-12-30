import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { couple: { include: { users: true } } }
    });

    if (!user || !user.couple) {
      return NextResponse.json([]);
    }

    const history = await prisma.devotionalSession.findMany({
      where: {
        coupleId: user.couple.id,
      },
      orderBy: { date: 'desc' },
      include: {
        template: true,
        userProgress: { include: { user: true } },
        notes: { include: { user: true } },
      },
    });
    
    // Decrypt notes for all sessions
    if (user.couple.encryptionKey) {
       const { decryptNote } = await import('@/lib/encryption');
       
       const decryptedHistory = history.map(session => {
         const decryptedNotes = session.notes.map(note => {
           try {
             if (!note.content) return note;
             return {
               ...note,
               content: decryptNote(note.content, user.couple!.encryptionKey!)
             };
           } catch (e) {
             console.error('Error decrypting note history', e);
             return note;
           }
         });
         return { ...session, notes: decryptedNotes };
       });

       return NextResponse.json(decryptedHistory);
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
