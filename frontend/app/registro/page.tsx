// app/registro/page.tsx
'use client'

/**
 * Página: /registro
 * Descripción: Landing de autenticación/registro. Según el "tipo" de usuario en estado local,
 *              renderiza el dashboard correspondiente (Admin o Colaborador). Por defecto muestra
 *              <AuthTabs/> para que el usuario inicie sesión o navegue al flujo de registro.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Notas:
 * - `use client`: componente de cliente (React).
 * - `currentUser` se usa como mock/local state para decidir qué dashboard mostrar.
 * - `onColabRegister` navega al flujo de registro de colaborador (paso 1).
 */

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

  // Si el usuario en estado es admin, renderiza su dashboard
  if (currentUser?.type === 'admin') return <AdminDashboard onLogout={handleLogout} />;

  // Si es colaborador, renderiza el dashboard de colaborador
  if (currentUser?.type === 'colaborador')
    return <ColaboradorDashboard onLogout={handleLogout} colaboradorName={currentUser.name} />;

  // Por defecto, muestra las pestañas de autenticación/registro
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
