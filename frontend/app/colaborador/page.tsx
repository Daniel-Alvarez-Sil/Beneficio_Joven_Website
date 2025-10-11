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


    return <ColaboradorDashboard onLogout={handleLogout} colaboradorName={"Admin"} />;

  
}
