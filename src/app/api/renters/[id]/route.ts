import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DbService } from '@/services/dbService';

// GET /api/renters/[id] - Get a single renter
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const renterId = parseInt(id, 10);

        if (isNaN(renterId)) {
            return NextResponse.json({ error: 'Invalid renter ID' }, { status: 400 });
        }

        const renter = await DbService.getRenterById(renterId);

        if (!renter) {
            return NextResponse.json({ error: 'Renter not found' }, { status: 404 });
        }

        return NextResponse.json(renter);
    } catch (error) {
        console.error('Renter API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch renter' },
            { status: 500 }
        );
    }
}

// PATCH /api/renters/[id] - Update renter profile or status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const updated = await DbService.updateRenter(id, body, session.user.id);

        if (!updated) {
            return NextResponse.json({ error: 'Renter not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true, renter: updated });
    } catch (error) {
        console.error('Renter API error:', error);
        return NextResponse.json(
            { error: 'Failed to update renter' },
            { status: 500 }
        );
    }
}

// DELETE /api/renters/[id] - Delete renter
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await DbService.deleteRenter(id, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Renter API error:', error);
        return NextResponse.json(
            { error: 'Failed to delete renter' },
            { status: 500 }
        );
    }
}
