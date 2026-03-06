import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { status } = await request.json();
    const { id: orderId } = await params;

    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Role-based status transition logic
    if (session.role === 'driver') {
      if (status === 'assigned' && order.status === 'searching') {
        db.prepare('UPDATE orders SET status = ?, driverId = ? WHERE id = ?').run(status, session.id, orderId);
      } else if (['picked_up', 'delivered'].includes(status) && order.driverId === session.id) {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
      } else {
        return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
      }
    } else if (session.role === 'admin') {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    } else if (session.role === 'restaurant') {
        if (status === 'cancelled' && order.restaurantId === (db.prepare('SELECT id FROM restaurants WHERE userId = ?').get(session.id) as any).id) {
            db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
        } else {
            return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
        }
    }

    const updatedOrder = db.prepare('SELECT o.*, r.name as restaurantName FROM orders o JOIN restaurants r ON o.restaurantId = r.id WHERE o.id = ?').get(orderId);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      const { id } = await params;
      db.prepare('DELETE FROM orders WHERE id = ?').run(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
