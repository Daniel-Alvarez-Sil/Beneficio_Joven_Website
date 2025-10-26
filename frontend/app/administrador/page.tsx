// app/administrador/page.tsx
'use client'

/**
 * Página: /administrador
 * Descripción: Entrypoint del dashboard de Administrador en el cliente. 
 * Renderiza el componente <AdminDashboard /> y maneja un logout local simple.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Notas:
 * - `use client`: este archivo se ejecuta en el cliente (React), no en Server Components.
 * - `currentUser` está presente para futura lógica de sesión/estado, pero actualmente no condiciona el render.
 * - `handleLogout` limpia el estado local; el cierre de sesión real (tokens/cookies) debe hacerse en acciones del servidor.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/AdminDashboard';

type User = { name: string; email: string; type: 'admin' | 'colaborador' };

export default function App() {
  const router = useRouter();
  // Estado local del usuario actual; actualmente no se usa para condicionar la UI.
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Callback sencillo para "cerrar sesión" a nivel de estado local.
  const handleLogout = () => setCurrentUser(null);

  // Render directo del dashboard de administrador.
  return <AdminDashboard onLogout={handleLogout} />;
  
}
