import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function GET() {
  try {
    // Check if admin exists
    const admin: any = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
    
    if (!admin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
        'admin@repartoya.com',
        hashedPassword,
        'admin',
        'Administrador'
      );
      
      // Seed a restaurant
      const restPassword = bcrypt.hashSync('rest123', 10);
      const restUserResult = db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
        'rest@test.com',
        restPassword,
        'restaurant',
        'Pizzería Test'
      );
      
      db.prepare('INSERT INTO restaurants (userId, name, address) VALUES (?, ?, ?)').run(
        restUserResult.lastInsertRowid,
        'Pizzería Test',
        'Calle Falsa 123'
      );

      // Seed a driver
      const driverPassword = bcrypt.hashSync('driver123', 10);
      db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
        'driver@test.com',
        driverPassword,
        'driver',
        'Juan Repartidor'
      );

      return NextResponse.json({ message: 'Database seeded successfully' });
    }

    return NextResponse.json({ message: 'Database already seeded' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
