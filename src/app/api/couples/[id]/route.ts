
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
