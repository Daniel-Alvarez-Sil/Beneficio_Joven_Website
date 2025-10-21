'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ColaboradorHeader } from '@/components/ColaboradorHeader';
import { ColaboradorDashboard } from '@/components/ColaboradorDashboard';
import { ColaboradorPromociones } from '@/components/ColaboradorPromocion';
import { ColaboradorCajero } from '@/components/ColaboradorCajero';

type User = { name: string; email: string; type: 'admin' | 'colaborador' };

export default function App() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>({
    name: 'Admin',
    email: 'admin@example.com',
    type: 'admin',
  });

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/');
  };

  const idNegocio = '3'; // ⬅️ cámbialo cuando lo obtengas de tu store/auth

  return (
    <div className="relative min-h-screen text-white">
      {/* Fondo aurora si quieres repetir el look del login */}
      <div className="auth-aurora" />
      <div className="auth-stars" />

      <ColaboradorHeader />

      <main className="max-w-7xl mx-auto px-4 mt-6 md:mt-8 pb-10">
        <Tabs defaultValue="dashboard" className="w-full">
          {/* Tabs estilo píldora glass */}
          <TabsList
            className="
              flex w-fit mx-auto
              rounded-2xl
              bg-white/10 backdrop-blur
              border border-white/20
              p-1.5 gap-2
              shadow-sm
            "
            aria-label="Navegación del panel"
          >
            <TabsTrigger
              value="dashboard"
              className="
                rounded-xl px-6 py-3
                text-sm font-medium text-white/80
                data-[state=active]:bg-white/25
                data-[state=active]:text-white
                hover:bg-white/15
                transition-all
              "
            >
              Dashboard
            </TabsTrigger>

            <TabsTrigger
              value="promos"
              className="
                rounded-xl px-6 py-3
                text-sm font-medium text-white/80
                data-[state=active]:bg-white/25
                data-[state=active]:text-white
                hover:bg-white/15
                transition-all
              "
            >
              Promociones
            </TabsTrigger>

            {/* ⬇️ Nuevo tab Cajero */}
            <TabsTrigger
              value="cajero"
              className="
                rounded-xl px-6 py-3
                text-sm font-medium text-white/80
                data-[state=active]:bg-white/25
                data-[state=active]:text-white
                hover:bg-white/15
                transition-all
              "
            >
              Cajero
            </TabsTrigger>
          </TabsList>

          {/* Contenido */}
          <TabsContent value="dashboard" className="mt-8">
            <ColaboradorDashboard
              onLogout={handleLogout}
              colaboradorName={currentUser?.name ?? 'Colaborador'}
              idNegocio={idNegocio}
            />
          </TabsContent>

          <TabsContent value="promos" className="mt-8">
            <ColaboradorPromociones
              colaboradorName={currentUser?.name ?? 'Colaborador'}
              onLogout={handleLogout}
              idNegocio={idNegocio}
            />
          </TabsContent>

          {/* ⬇️ Contenido Cajero */}
          <TabsContent value="cajero" className="mt-8">
            <ColaboradorCajero
              colaboradorName={currentUser?.name ?? 'Colaborador'}
              idNegocio={idNegocio}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
