'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Package, Users, MapPin, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSocket } from '@/lib/socket-client';

export default function AdminView({ user }: { user: any }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'users'>('orders');

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      return res.json();
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    },
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on('order-update', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    });
    return () => {
      socket.off('order-update');
    };
  }, [queryClient]);

  const deleteOrder = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await fetch('/api/users', { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Panel de Control Maestro</h2>
          <p className="text-sm text-slate-500">Supervisión global de la red de RepartoYa</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <Package size={16} />
              Pedidos
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              Usuarios
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 gap-6"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Restaurante</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">#{order.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">{order.restaurantName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{order.customerName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin size={10} /> {order.customerAddress}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteOrder.mutate(order.id)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!orders || orders.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                          No hay pedidos registrados en el sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="users"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {users?.map((u: any) => (
              <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' :
                    u.role === 'restaurant' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {u.role === 'admin' ? <ShieldCheck size={24} /> : u.role === 'restaurant' ? <Utensils size={24} /> : <Truck size={24} />}
                  </div>
                  <button 
                    onClick={() => deleteUser.mutate(u.id)}
                    disabled={u.id === user.id}
                    className="p-2 text-slate-300 hover:text-red-600 transition-colors disabled:opacity-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{u.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{u.email}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    u.role === 'restaurant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pending: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock, label: 'Pendiente' },
    searching: { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Search, label: 'Buscando' },
    assigned: { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Truck, label: 'Asignado' },
    picked_up: { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Package, label: 'En camino' },
    delivered: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2, label: 'Entregado' },
    cancelled: { color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle, label: 'Cancelado' },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

import { ShieldCheck, Utensils, Truck } from 'lucide-react';
