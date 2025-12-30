// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '@/lib/mail';

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
    const verificationToken = uuidv4();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('Failed to send verification email:', e);
      // We don't fail the registration if email fails, but maybe we should?
      // For now, just log the error. The user can request another one later (to be implemented).
    }

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
          include: {
            couple: {
              include: {
                users: true,
              },
            },
          },
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