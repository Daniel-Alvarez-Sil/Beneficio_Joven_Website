'use client';

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthLayout } from "./AuthLayout";
import type { LoginFormState } from "@/lib/definitions";

import { useRouter } from 'next/navigation';

// ...




type ServerAction = (
  prevState: LoginFormState | null,
  formData: FormData
) => Promise<LoginFormState>;

interface LoginFormProps {
  userType: 'admin' | 'colaborador';
  /** Optional: if provided, <form action={action}> will invoke the server action (auth.ts: signup). */
  action?: ServerAction;

  /** Fallback/on-legacy client handler (kept for backwards compatibility) */
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
      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
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
  // Controlled inputs preserved (works fine with Server Actions as long as name=... is set)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();


  // When a server action is provided, wire it up with useFormState:
  const [state, formAction] = useFormState(action ?? (async (_prev, fd) => {
    // Fallback to legacy onLogin if no server action is passed
    onLogin?.({
      email: (fd.get('username') as string) ?? '',
      password: (fd.get('password') as string) ?? ''
    });
    // mimic server action shape
    return { success: true } as LoginFormState;
  }), initialState);

  useEffect(() => {
  if (state?.success) {
    // prefer replace to avoid going back to the login page with back button
    router.replace(state.redirectTo ?? '/');
  }
}, [state?.success, state?.redirectTo, router]);

  // Optional: client-side redirect if server action returns { success: true } and you don't use redirect() in auth.ts
  // import { useRouter } from "next/navigation";
  // const router = useRouter();
  // useEffect(() => {
  //   if (state?.success) router.push("/");
  // }, [state?.success, router]);

  const defaultTitle = userType === 'admin' ? 'INICIA SESIÓN' : 'COLABORADOR';
  const defaultSubtitle = userType === 'admin' ? 'Administrador' : 'Ingresa tus credenciales';

  const content = (
    <>
      {/* IMPORTANT: match auth.ts -> expects fields 'username' and 'password' in FormData */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Usuario / Email</Label>
          <Input
            id="email"
            // type="email"
            name="username"              // <-- must be "username" to match auth.ts
            // value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          {/* Field error (optional if your schema returns username errors) */}
          {state?.errors?.username?.length ? (
            <p className="text-sm text-red-600">{state.errors.username[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            name="password"             // <-- must be "password" to match auth.ts
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
          {/* Field error */}
          {state?.errors?.password?.length ? (
            <p className="text-sm text-red-600">{state.errors.password[0]}</p>
          ) : null}
        </div>

        {/* General/global error from server */}
        {state?.errors?.general?.length ? (
          <p className="text-sm text-red-600">{state.errors.general[0]}</p>
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
            className="w-full"
            onClick={onSwitchUserType}
            type="button"
          >
            {userType === 'admin' ? 'Login Colaboradores' : 'Login Administradores'}
          </Button>
        )}

        {onSwitchToRegister && userType === 'colaborador' && (
          <Button
            variant="ghost"
            className="w-full"
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
