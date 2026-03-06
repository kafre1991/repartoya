import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = 'SELECT o.*, r.name as restaurantName FROM orders o JOIN restaurants r ON o.restaurantId = r.id';
  const params: any[] = [];

  if (session.role === 'restaurant') {
    const restaurant: any = db.prepare('SELECT id FROM restaurants WHERE userId = ?').get(session.id);
    query += ' WHERE o.restaurantId = ?';
    params.push(restaurant.id);
  } else if (session.role === 'driver') {
    query += ' WHERE (o.driverId = ? OR o.status = "searching")';
    params.push(session.id);
  }

  if (status) {
    query += (params.length > 0 ? ' AND' : ' WHERE') + ' o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.createdAt DESC';

  const orders = db.prepare(query).all(...params);
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'restaurant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customerName, customerAddress } = await request.json();
    const restaurant: any = db.prepare('SELECT id FROM restaurants WHERE userId = ?').get(session.id);

    const result = db.prepare(
      'INSERT INTO orders (restaurantId, customerName, customerAddress, status) VALUES (?, ?, ?, ?)'
    ).run(restaurant.id, customerName, customerAddress, 'searching');

    const newOrder = db.prepare('SELECT o.*, r.name as restaurantName FROM orders o JOIN restaurants r ON o.restaurantId = r.id WHERE o.id = ?').get(result.lastInsertRowid);

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
