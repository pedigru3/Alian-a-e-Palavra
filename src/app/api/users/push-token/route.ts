import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Token is required' }), { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { pushToken: token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push token update error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
