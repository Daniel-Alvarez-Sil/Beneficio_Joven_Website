'use client'

import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ColaboradorDashboard } from '@/components/ColaboradorDashboard';

type AppState = 'login-admin' | 'login-colaborador' | 'register' | 'admin-dashboard' | 'colaborador-dashboard';

interface User {
  name: string;
  email: string;
  type: 'admin' | 'colaborador';
}

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('login-admin');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (credentials: { email: string; password: string }, userType: 'admin' | 'colaborador') => {
    // Simulación de autenticación
    const mockUser: User = {
      name: userType === 'admin' ? 'Administrador' : 'María García',
      email: credentials.email,
      type: userType
    };
    
    setCurrentUser(mockUser);
    setCurrentState(userType === 'admin' ? 'admin-dashboard' : 'colaborador-dashboard');
  };

  const handleRegister = (data: { name: string; email: string; password: string; company: string }) => {
    // Simulación de registro
    const newUser: User = {
      name: data.name,
      email: data.email,
      type: 'colaborador'
    };
    
    setCurrentUser(newUser);
    setCurrentState('colaborador-dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentState('login-admin');
  };

  const switchUserType = () => {
    if (currentState === 'login-admin') {
      setCurrentState('login-colaborador');
    } else if (currentState === 'login-colaborador') {
      setCurrentState('login-admin');
    }
  };

  if (currentState === 'admin-dashboard' && currentUser) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (currentState === 'colaborador-dashboard' && currentUser) {
    return (
      <ColaboradorDashboard 
        onLogout={handleLogout} 
        colaboradorName={currentUser.name}
      />
    );
  }

  if (currentState === 'register') {
    return (
      <RegisterForm 
        onRegister={handleRegister}
        onBackToLogin={() => setCurrentState('login-colaborador')}
      />
    );
  }

  return (
    <LoginForm
      userType={currentState === 'login-admin' ? 'admin' : 'colaborador'}
      onLogin={(credentials) => handleLogin(credentials, currentState === 'login-admin' ? 'admin' : 'colaborador')}
      onSwitchToRegister={currentState === 'login-colaborador' ? () => setCurrentState('register') : undefined}
      onSwitchUserType={switchUserType}
    />
  );
}