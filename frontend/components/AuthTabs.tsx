// components/AuthTabs.tsx

/**
 * Componente: AuthTabs
 * Descripción: Contenedor con pestañas para alternar el inicio de sesión
 *              entre "Administrador" y "Colaborador". Envuelve cada vista
 *              dentro de `AuthLayout` y renderiza un `LoginForm` distinto
 *              según la pestaña activa. Para colaboradores, expone un
 *              callback para redirigir al flujo de registro.
 *
 * Props:
 * - defaultTab?: "admin" | "colaborador" — pestaña inicial (por defecto "admin")
 * - onAdminLogin(credentials): callback al autenticar admin
 * - onColabLogin(credentials): callback al autenticar colaborador
 * - onColabRegister?(): callback para navegar al registro de colaborador
 *
 * Detalles:
 * - Usa `signup` (server action) como `action` para el `LoginForm`.
 * - Los títulos/subtítulos de `AuthLayout` cambian según la pestaña activa.
 * - UI basada en `Tabs` (shadcn/ui) con estilo tipo píldora.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthLayout } from "./AuthLayout";
import { LoginForm } from "./LoginForm";

type Credentials = { email: string; password: string };

import { signup } from "@/actions/login/auth"; // adjust the path to your auth.ts

interface AuthTabsProps {
  defaultTab?: "admin" | "colaborador";
  onAdminLogin: (credentials: Credentials) => void;
  onColabLogin: (credentials: Credentials) => void;
  onColabRegister?: () => void; // Navega a /registro/colaborador
}

export function AuthTabs({
  defaultTab = "admin",
  onAdminLogin,
  onColabLogin,
  onColabRegister,
}: AuthTabsProps) {
  const [tab, setTab] = useState<"admin" | "colaborador">(defaultTab);

  const { title, subtitle } = useMemo(() => {
    if (tab === "admin") return { title: "INICIA SESIÓN", subtitle: "Administrador" };
    return { title: "COLABORADOR", subtitle: "Ingresa tus credenciales" };
  }, [tab]);

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "admin" | "colaborador")} className="w-full">
        {/* Tabs estilo píldora */}
        <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-muted/60 p-1">
          <TabsTrigger
            value="admin"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition"
          >
            Administrador
          </TabsTrigger>
          <TabsTrigger
            value="colaborador"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition"
          >
            Colaborador
          </TabsTrigger>
        </TabsList>

        {/* Contenido Admin */}
        <TabsContent value="admin" className="mt-0">
          <LoginForm
            embedded
            userType="admin"
            onLogin={onAdminLogin}
            action={signup} 
          />
        </TabsContent>

        {/* Contenido Colaborador */}
        <TabsContent value="colaborador" className="mt-0">
          <LoginForm
            embedded
            userType="colaborador"
            onLogin={onColabLogin}
            action={signup} 
            // En lugar del RegisterForm antiguo, disparamos el flujo nuevo (paso 1)
            onSwitchToRegister={() => onColabRegister?.()}
          />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
