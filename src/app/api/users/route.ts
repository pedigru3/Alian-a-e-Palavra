// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse(JSON.stringify({ error: 'User already exists' }), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
  
    if (email) {
      // Fetch a single user by email
      try {
        const user = await prisma.user.findUnique({
          where: { email: email as string },
        });
        if (user) {
          return NextResponse.json(user);
        } else {
          return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }
      } catch (error) {
        console.error(`Error fetching user by email ${email}:`, error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
      }
    } else {
      // Fetch all users
      try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users);
      } catch (error) {
        console.error('Error fetching all users:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
      }
    }
  }