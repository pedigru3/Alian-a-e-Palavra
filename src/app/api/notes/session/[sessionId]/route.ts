import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { decryptNote, ensureCoupleEncryptionKey } from '@/lib/encryption';

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  try {
    const authedSession = await getServerSession(authOptions);
    if (!authedSession || !authedSession.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Busca o usuário e o casal para obter a chave de criptografia
    const user = await prisma.user.findUnique({
      where: { email: authedSession.user.email },
      include: { couple: true },
    });

    if (!user || !user.couple) {
      return NextResponse.json({ error: 'User must belong to a couple' }, { status: 403 });
    }

    // Verifica se a sessão pertence ao casal do usuário
    const session = await prisma.devotionalSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.coupleId !== user.coupleId) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    // Garante que o casal tenha uma chave de criptografia (gera se não existir)
    const encryptionKey = await ensureCoupleEncryptionKey(user.couple.id, user.couple.encryptionKey);

    const notes = await prisma.note.findMany({
      where: { sessionId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    // Descriptografa as notas antes de retornar
    const decryptedNotes = notes.map((note) => {
      if (note.content) {
        return {
          ...note,
          content: decryptNote(note.content, encryptionKey),
        };
      }
      return note;
    });

    return NextResponse.json(decryptedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
