import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encryptNote, ensureCoupleEncryptionKey } from '@/lib/encryption';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const authedSession = await getServerSession(authOptions);
    if (!authedSession || !authedSession.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    // Busca o usuário e o casal para obter a chave de criptografia
    const user = await prisma.user.findUnique({
      where: { email: authedSession.user.email },
      include: { couple: true },
    });

    if (!user || !user.couple) {
      return NextResponse.json({ error: 'User must belong to a couple' }, { status: 403 });
    }

    // Verifica se a nota pertence ao usuário
    const existingNote = await prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote || existingNote.userId !== user.id) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    // Garante que o casal tenha uma chave de criptografia (gera se não existir)
    const encryptionKey = await ensureCoupleEncryptionKey(user.couple.id, user.couple.encryptionKey);

    // Criptografa o conteúdo da nota
    let encryptedContent = content;
    if (content) {
      encryptedContent = encryptNote(content, encryptionKey);
    }

    const note = await prisma.note.update({
      where: { id },
      data: { content: encryptedContent }
    });

    // Retorna a nota com conteúdo original (não criptografado) para o frontend
    return NextResponse.json({ ...note, content });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}
