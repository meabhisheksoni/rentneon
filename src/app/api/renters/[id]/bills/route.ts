import { auth } from '@/auth';
import { DbService } from '@/services/dbService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const renterId = parseInt(id, 10);
        if (isNaN(renterId)) {
            return new NextResponse('Invalid Renter ID', { status: 400 });
        }

        const bills = await DbService.getAllBillsWithDetails(
            renterId,
            session.user.id
        );

        return NextResponse.json(bills);
    } catch (error) {
        console.error('[BILLS_GET_ALL]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
