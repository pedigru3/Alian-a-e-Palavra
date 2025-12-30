import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const couple = await prisma.couple.findUnique({
            where: { id },
        });
        if (couple) {
            return NextResponse.json(couple);
        } else {
            return new NextResponse(JSON.stringify({ error: 'Couple not found' }), { status: 404 });
        }
    } catch (error) {
        console.error(`Error fetching couple ${id}:`, error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id: coupleId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return new NextResponse(JSON.stringify({ error: 'Password is required' }), { status: 400 });
        }

        // 1. Get current user and their password hash
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser) {
            return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(password, currentUser.password);
        if (!isPasswordValid) {
            return new NextResponse(JSON.stringify({ error: 'Incorrect password' }), { status: 403 });
        }

        // 3. Verify user is part of the couple they are trying to delete
        if (currentUser.coupleId !== coupleId) {
            return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        // 4. Disconnect all users and delete the couple
        // We do this in a transaction to ensure consistency
        await prisma.$transaction([
            // Update all users in the couple to be single
            prisma.user.updateMany({
                where: { coupleId },
                data: { coupleId: null }
            }),
            // Delete the couple (this will cascade delete plans if schema allows, 
            // otherwise we might need to delete them manually if not cascade)
            prisma.couple.delete({
                where: { id: coupleId }
            })
        ]);

        return NextResponse.json({ message: 'Couple disconnected successfully' });
    } catch (error) {
        console.error(`Error deleting couple ${coupleId}:`, error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
