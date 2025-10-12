'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ColaboradorDashboard } from '@/components/ColaboradorDashboard';
import { ColaboradorPromociones } from '@/components/ColaboradorPromocion';

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
    router.push('/'); // adjust if you have a specific login route
  };

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Panel</h1>
        </div>

        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="promos">Promociones</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <ColaboradorDashboard
            onLogout={handleLogout}
            colaboradorName={currentUser?.name ?? 'Colaborador'}
          />
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          <ColaboradorPromociones
            colaboradorName={'Colaborador'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
