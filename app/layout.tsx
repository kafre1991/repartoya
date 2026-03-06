import type {Metadata} from 'next';
import './globals.css'; // Global styles
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'RepartoYa - Conectando Sabores',
  description: 'Plataforma de reparto para restaurantes y repartidores.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
