import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthLayout } from "./AuthLayout";

interface LoginFormProps {
  userType: 'admin' | 'colaborador';
  onLogin: (credentials: { email: string; password: string }) => void;
  onSwitchToRegister?: () => void;
  onSwitchUserType?: () => void;
}

export function LoginForm({ userType, onLogin, onSwitchToRegister, onSwitchUserType }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  const title = userType === 'admin' ? 'INICIA SESIÓN' : 'COLABORADOR';
  const subtitle = userType === 'admin' ? 'Administrador' : 'Ingresa tus credenciales';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Usuario / Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        {onSwitchUserType && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onSwitchUserType}
          >
            {userType === 'admin' ? 'Login Colaboradores' : 'Login Administradores'}
          </Button>
        )}
        
        {onSwitchToRegister && userType === 'colaborador' && (
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onSwitchToRegister}
          >
            Registrarse
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}