// components/LoginForm.tsx

/**
 * Componente: LoginForm
 * Descripción:
 *   Formulario de autenticación reutilizable para dos flujos:
 *   - Administrador
 *   - Colaborador
 *   Soporta Server Actions (Next.js) o, en su defecto, un callback `onLogin` de compatibilidad.
 *
 * Flujo general:
 *   1) Renderiza inputs controlados para usuario y contraseña.
 *   2) Al enviar:
 *      - Si se proporcionó `action` (Server Action), se invoca con `useFormState`.
 *      - Si NO hay `action`, usa `onLogin` como fallback (legado).
 *   3) Si `state.success` es true, redirige usando `router.replace` a `state.redirectTo`
 *      o a un valor por defecto según `userType`.
 *
 * Integración con Server Actions:
 *   - La Server Action debe aceptar (prevState, formData) y devolver un `LoginFormState`.
 *   - IMPORTANTE: el backend espera los campos `username` y `password` en `FormData`.
 *   - El formulario también envía `redirectTo` oculto para la ruta post-login.
 *
 * Props:
 *   - userType: 'admin' | 'colaborador' → ajusta textos y redirect por defecto.
 *   - action?: ServerAction                → Server Action para login (recomendado).
 *   - onLogin?: (credentials)             → Fallback sin Server Action.
 *   - onSwitchToRegister?: () => void     → Muestra botón “Registrarse” si userType=colaborador.
 *   - onSwitchUserType?: () => void       → Muestra botón para alternar vista (admin/colab).
 *   - embedded?: boolean                  → Si true, renderiza sólo el formulario (sin AuthLayout).
 *   - titleOverride?: string              → Sobrescribe título del layout.
 *   - subtitleOverride?: string           → Sobrescribe subtítulo del layout.
 *
 * Accesibilidad:
 *   - Labels asociados a inputs (`htmlFor` / `id`).
 *   - Estados de error visibles bajo cada campo.
 *   - Botón de submit deshabilitado y con texto dinámico mientras `pending`.
 *
 * Errores y estados:
 *   - Usa `useFormState` + `useFormStatus` para manejar `pending` y `state.errors`.
 *   - Muestra errores por campo: `state.errors.username`, `state.errors.password`,
 *     y error general `state.errors.general`.
 *
 * UI/Estilos:
 *   - Integra con componentes UI (shadcn/ui) y estilo “btn-gradient / btn-apple”.
 *   - `AuthLayout` envuelve contenido cuando `embedded=false`.
 *
 * Seguridad:
 *   - No almacena contraseña en ningún store global; sólo en estado local controlado.
 *   - Se recomienda manejar la lógica de rate limiting y auditoría en la server action.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

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
  /** Si se pasa, <form action={action}> invoca la server action (auth.ts). */
  action?: ServerAction;

  /** Fallback legacy (compatibilidad hacia atrás, sin server action). */
  onLogin?: (credentials: { email: string; password: string }) => void;

  onSwitchToRegister?: () => void;
  onSwitchUserType?: () => void;
  embedded?: boolean;
  titleOverride?: string;
  subtitleOverride?: string;
}

/** Botón de envío que reacciona al estado `pending` de la Server Action. */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full btn-gradient btn-apple"
      aria-busy={pending}
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
  // Inputs controlados (coinciden los 'name' con lo que espera la Server Action).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Enlaza con server action o fallback onLogin:
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

  // Redirección post-login (prioriza redirect devuelto por la server action).
  useEffect(() => {
    if (state?.success) {
      router.replace(state.redirectTo ?? '/');
    }
  }, [state?.success, state?.redirectTo, router]);

  const defaultTitle = userType === 'admin' ? 'INICIA SESIÓN' : 'COLABORADOR';
  const defaultSubtitle = userType === 'admin' ? 'Administrador' : 'Ingresa tus credenciales';

  const content = (
    <>
      {/* Importante: el backend espera 'username' y 'password' en el FormData */}
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

        {/* La ruta post-login por defecto según el tipo de usuario */}
        <input
          type="hidden"
          name="redirectTo"
          value={userType === 'admin' ? '/administrador' : '/colaborador'}
        />

        <SubmitButton />
      </form>

      {/* Acciones secundarias: alternar tipo de login y registro de colaboradores */}
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
