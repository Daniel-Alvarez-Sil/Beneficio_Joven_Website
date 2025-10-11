'use client';

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthLayout } from "./AuthLayout";
import { LoginForm } from "./LoginForm";

type Credentials = { email: string; password: string };

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
          />
        </TabsContent>

        {/* Contenido Colaborador */}
        <TabsContent value="colaborador" className="mt-0">
          <LoginForm
            embedded
            userType="colaborador"
            onLogin={onColabLogin}
            // En lugar del RegisterForm antiguo, disparamos el flujo nuevo (paso 1)
            onSwitchToRegister={() => onColabRegister?.()}
          />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
