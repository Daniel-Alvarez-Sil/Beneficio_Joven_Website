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

  /** Si true, NO envuelve con AuthLayout (se usa dentro de un layout externo). */
  embedded?: boolean;
  /** Títulos opcionales cuando embedded = false (normalmente los define el propio componente). */
  titleOverride?: string;
  subtitleOverride?: string;
}

export function LoginForm({
  userType,
  onLogin,
  onSwitchToRegister,
  onSwitchUserType,
  embedded = false,
  titleOverride,
  subtitleOverride
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  const defaultTitle = userType === 'admin' ? 'INICIA SESIÓN' : 'COLABORADOR';
  const defaultSubtitle = userType === 'admin' ? 'Administrador' : 'Ingresa tus credenciales';

  const content = (
    <>
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
    </>
  );

  if (embedded) {
    // No usamos AuthLayout; solo el contenido del formulario.
    return content;
  }

  // Modo original (con AuthLayout)
  const title = titleOverride ?? defaultTitle;
  const subtitle = subtitleOverride ?? defaultSubtitle;

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {content}
    </AuthLayout>
  );
}
