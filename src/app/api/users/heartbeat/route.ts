import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
