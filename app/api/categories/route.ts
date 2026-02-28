import { NextResponse } from 'next/server';
import { Category } from '@/generated/prisma/client';

export async function GET() {
    try {
        const categories = Object.values(Category);
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
