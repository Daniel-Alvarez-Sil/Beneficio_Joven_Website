'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ColaboradorDashboard } from '@/components/ColaboradorDashboard';
import { AuthTabs } from '@/components/AuthTabs';

type User = { name: string; email: string; type: 'admin' | 'colaborador' };

export default function App() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogout = () => setCurrentUser(null);

  if (currentUser?.type === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (currentUser?.type === 'colaborador')
    return <ColaboradorDashboard onLogout={handleLogout} colaboradorName={currentUser.name} />;

  return (
    <main className="min-h-screen">
      <AuthTabs
        defaultTab="admin"
        onAdminLogin={(c) => setCurrentUser({ name: 'Administrador', email: c.email, type: 'admin' })}
        onColabLogin={(c) => setCurrentUser({ name: 'María García', email: c.email, type: 'colaborador' })}
        onColabRegister={() => router.push('/registro/colaborador')}  // 👈 va directo al paso 1
      />
    </main>
  );
}
