import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = db.prepare('SELECT id, email, role, name FROM users').all();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, role, name, restaurantName, restaurantAddress } = await request.json();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
      email,
      hashedPassword,
      role,
      name
    );

    if (role === 'restaurant') {
      db.prepare('INSERT INTO restaurants (userId, name, address) VALUES (?, ?, ?)').run(
        result.lastInsertRowid,
        restaurantName || name,
        restaurantAddress || 'N/A'
      );
    }

    return NextResponse.json({ id: result.lastInsertRowid, email, role, name });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
