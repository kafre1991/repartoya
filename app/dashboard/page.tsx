'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User, LayoutDashboard, Settings, Bell } from 'lucide-react';
import AdminView from '@/components/AdminView';
import RestaurantView from '@/components/RestaurantView';
import DriverView from '@/components/DriverView';
import { getSocket } from '@/lib/socket-client';

export default function DashboardPage() {
  const router = useRouter();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    },
    retry: false,
  });

  const user = me?.user;

  useEffect(() => {
    if (!isLoading && !me) {
      router.push('/');
    } else if (user) {
      const socket = getSocket();
      socket.emit('join-room', user.role === 'admin' ? 'admins' : user.role === 'driver' ? 'drivers' : `restaurant-${user.id}`);
    }
  }, [me, isLoading, router, user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <LayoutDashboard size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">RepartoYa</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200">
                {user.role}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{user.email}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'admin' && <AdminView user={user} />}
        {user.role === 'restaurant' && <RestaurantView user={user} />}
        {user.role === 'driver' && <DriverView user={user} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            © 2026 RepartoYa • Sistema de Gestión Logística
          </p>
        </div>
      </footer>
    </div>
  );
}
