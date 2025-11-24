import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET a single user by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        couple: {
          include: {
            users: true
          }
        }
      }
    });
    if (user) {
      return NextResponse.json(user);
    } else {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// UPDATE a user by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await request.json();
    const { name, email, coupleId } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        coupleId,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// DELETE a user by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await prisma.user.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}