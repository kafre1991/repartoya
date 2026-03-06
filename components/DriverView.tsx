'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, CheckCircle2, XCircle, Search, Package, Navigation, Truck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSocket } from '@/lib/socket-client';

export default function DriverView({ user }: { user: any }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'available' | 'my-orders'>('available');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['driver-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      return res.json();
    },
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on('order-update', () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
    });
    return () => {
      socket.off('order-update');
    };
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      getSocket().emit('order-status-change', { type: 'status-update' });
    },
  });

  const availableOrders = orders?.filter((o: any) => o.status === 'searching') || [];
  const myOrders = orders?.filter((o: any) => o.driverId === user.id && o.status !== 'delivered' && o.status !== 'cancelled') || [];

  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rutas de Entrega</h2>
          <p className="text-sm text-slate-500">Gestiona tus pedidos y encuentra nuevas entregas</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'available' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <Search size={16} />
              Disponibles ({availableOrders.length})
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('my-orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'my-orders' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <Truck size={16} />
              Mis Pedidos ({myOrders.length})
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'available' ? (
          <motion.div 
            key="available"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {availableOrders.map((order: any) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Orden #{order.id}</span>
                    <h3 className="text-lg font-bold text-slate-900">{order.restaurantName}</h3>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase border border-amber-100">Nuevo</div>
                </div>
                
                <div className="space-y-4 mb-6 flex-1">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">Destino:</span>
                      <span>{order.customerAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} />
                    <span>Publicado hace {getTimeAgo(order.createdAt)} min</span>
                  </div>
                </div>

                <button 
                  onClick={() => updateStatus.mutate({ id: order.id, status: 'assigned' })}
                  disabled={updateStatus.isPending}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Truck size={18} />
                  Aceptar Pedido
                </button>
              </div>
            ))}
            {availableOrders.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Search size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Buscando nuevos pedidos...</p>
                <p className="text-xs text-slate-300 mt-1">Se te notificará cuando haya entregas cerca.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="my-orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            {myOrders.map((order: any) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md flex flex-col md:flex-row gap-6 items-center">
                <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Package size={32} />
                </div>
                
                <div className="flex-1 space-y-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{order.restaurantName}</h3>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500">
                    <MapPin size={14} />
                    <span>{order.customerAddress}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {order.status === 'assigned' && (
                    <button 
                      onClick={() => updateStatus.mutate({ id: order.id, status: 'picked_up' })}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all"
                    >
                      Marcar como Recogido
                    </button>
                  )}
                  {order.status === 'picked_up' && (
                    <button 
                      onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}
                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all"
                    >
                      Confirmar Entrega
                    </button>
                  )}
                  <button className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
            ))}
            {myOrders.length === 0 && (
              <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Package size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No tienes entregas activas.</p>
                <p className="text-xs text-slate-300 mt-1">Ve a la pestaña &quot;Disponibles&quot; para tomar un pedido.</p>
              </div>
            )}
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
      assigned: { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Navigation, label: 'Asignado' },
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
