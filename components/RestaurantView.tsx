'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Clock, CheckCircle2, XCircle, Search, Package, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { getSocket } from '@/lib/socket-client';

export default function RestaurantView({ user }: { user: any }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['restaurant-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      return res.json();
    },
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on('order-update', () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
    });
    return () => {
      socket.off('order-update');
    };
  }, [queryClient]);

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
      setShowForm(false);
      setCustomerName('');
      setCustomerAddress('');
      getSocket().emit('new-order', newOrder);
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
        getSocket().emit('order-status-change', { type: 'cancelled' });
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Pedidos</h2>
          <p className="text-sm text-slate-500">Crea y monitorea tus entregas en tiempo real</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} />
          Nuevo Pedido
        </button>
      </div>

      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50/50"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Navigation size={20} className="text-indigo-600" />
            Detalles del Envío
          </h3>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createOrder.mutate({ customerName, customerAddress });
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">Nombre del Cliente</label>
              <input 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: María García"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">Dirección de Entrega</label>
              <input 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Ej: Av. Principal #456"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={createOrder.isPending}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {createOrder.isPending ? 'Procesando...' : 'Confirmar y Buscar Repartidor'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders?.map((order: any) => (
          <div key={order.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Orden #{order.id}</span>
                <h3 className="text-lg font-bold text-slate-900">{order.customerName}</h3>
              </div>
              <StatusBadge status={order.status} />
            </div>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{order.customerAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                {order.status === 'searching' && (
                    <button 
                        onClick={() => cancelOrder.mutate(order.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
                    >
                        Cancelar Pedido
                    </button>
                )}
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-auto">
                    {order.status === 'searching' ? 'Esperando Repartidor...' : 'En Proceso'}
                </div>
            </div>
          </div>
        ))}
        {(!orders || orders.length === 0) && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Package size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No tienes pedidos activos en este momento.</p>
            <p className="text-xs text-slate-300 mt-1">¡Crea uno nuevo para empezar!</p>
          </div>
        )}
      </div>
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
