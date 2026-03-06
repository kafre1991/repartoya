'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogIn, Truck, Utensils, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Seed the database on first load
    fetch('/api/seed').catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Truck size={32} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">RepartoYa</h1>
          <p className="mt-2 text-sm text-slate-500 italic">Conectando restaurantes con el mundo</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Contraseña</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-indigo-300 group-hover:text-indigo-400" />
            </span>
            {loading ? 'Iniciando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Accesos de Prueba</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
              <ShieldCheck size={16} className="text-indigo-500" />
              <span>Admin</span>
              <span className="font-mono text-[8px]">admin@repartoya.com</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
              <Utensils size={16} className="text-emerald-500" />
              <span>Rest</span>
              <span className="font-mono text-[8px]">rest@test.com</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
              <Truck size={16} className="text-orange-500" />
              <span>Driver</span>
              <span className="font-mono text-[8px]">driver@test.com</span>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-slate-400">Contraseña común: <span className="font-mono font-bold">admin123</span>, <span className="font-mono font-bold">rest123</span>, <span className="font-mono font-bold">driver123</span></p>
        </div>
      </motion.div>
    </div>
  );
}
