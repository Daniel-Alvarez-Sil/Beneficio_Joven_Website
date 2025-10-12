'use client';

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthLayout } from "./AuthLayout";
import type { LoginFormState } from "@/lib/definitions";
import { useRouter } from 'next/navigation';

type ServerAction = (
  prevState: LoginFormState | null,
  formData: FormData
) => Promise<LoginFormState>;

interface LoginFormProps {
  userType: 'admin' | 'colaborador';
  /** Opcional: si se pasa, <form action={action}> invoca la server action (auth.ts: signup). */
  action?: ServerAction;

  /** Fallback legacy (compatibilidad hacia atrás) */
  onLogin?: (credentials: { email: string; password: string }) => void;

  onSwitchToRegister?: () => void;
  onSwitchUserType?: () => void;
  embedded?: boolean;
  titleOverride?: string;
  subtitleOverride?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full btn-gradient btn-apple"
    >
      {pending ? "Ingresando…" : "Iniciar sesión"}
    </Button>
  );
}

const initialState: LoginFormState | null = null;

export function LoginForm({
  userType,
  action,
  onLogin,
  onSwitchToRegister,
  onSwitchUserType,
  embedded = false,
  titleOverride,
  subtitleOverride
}: LoginFormProps) {
  // Controlled inputs (mantienen compat con Server Actions si name=... coincide)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Wire con server action o fallback onLogin
  const [state, formAction] = useFormState(
    action ?? (async (_prev, fd) => {
      onLogin?.({
        email: (fd.get('username') as string) ?? '',
        password: (fd.get('password') as string) ?? ''
      });
      return { success: true } as LoginFormState;
    }),
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      router.replace(state.redirectTo ?? '/');
    }
  }, [state?.success, state?.redirectTo, router]);

  const defaultTitle = userType === 'admin' ? 'INICIA SESIÓN' : 'COLABORADOR';
  const defaultSubtitle = userType === 'admin' ? 'Administrador' : 'Ingresa tus credenciales';

  const content = (
    <>
      {/* Importante: auth.ts espera 'username' y 'password' en el FormData */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-2 text-white/80">
          <Label htmlFor="email">Usuario / Email</Label>
          <Input
            id="email"
            name="username"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full input-apple text-white placeholder-white/50 caret-white"
            autoComplete="username"
            inputMode="email"
          />
          {state?.errors?.username?.length ? (
            <p className="text-sm text-red-500">{state.errors.username[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2 text-white/80">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full input-apple text-white placeholder-white/50 caret-white"
            autoComplete="current-password"
          />
          {state?.errors?.password?.length ? (
            <p className="text-sm text-red-500">{state.errors.password[0]}</p>
          ) : null}
        </div>

        {state?.errors?.general?.length ? (
          <p className="text-sm text-red-500">{state.errors.general[0]}</p>
        ) : null}

        <input
          type="hidden"
          name="redirectTo"
          value={userType === 'admin' ? '/negocio' : '/colaborador'}
        />

        <SubmitButton />
      </form>

      <div className="mt-6 space-y-2">
        {onSwitchUserType && (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={onSwitchUserType}
            type="button"
          >
            {userType === 'admin' ? 'Login Colaboradores' : 'Login Administradores'}
          </Button>
        )}

        {onSwitchToRegister && userType === 'colaborador' && (
          <Button
            variant="ghost"
            className="w-full h-12 rounded-xl text-white"
            onClick={onSwitchToRegister}
            type="button"
          >
            Registrarse
          </Button>
        )}
      </div>
    </>
  );

  if (embedded) return content;

  const title = titleOverride ?? defaultTitle;
  const subtitle = subtitleOverride ?? defaultSubtitle;

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {content}
    </AuthLayout>
  );
}
