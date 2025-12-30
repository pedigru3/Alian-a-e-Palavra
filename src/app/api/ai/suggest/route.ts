import { NextResponse } from 'next/server';
import { suggestScripture } from '@/services/geminiService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const suggestion = await suggestScripture();
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error suggesting scripture:', error);
    return NextResponse.json({ error: 'Failed to suggest scripture' }, { status: 500 });
  }
}
