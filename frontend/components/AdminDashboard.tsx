"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import NegociosGrid  from "@/components/admin/NegociosGrid";
import { SolicitudesList } from "@/components/admin/SolicitudesList";
import { AdminHeader } from "./AdminHeader";

interface AdminDashboardProps { onLogout: () => void }

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "colaboradores" | "solicitudes">("home");

  return (
    <div className="dark min-h-screen auth-bg text-white relative">
      {/* Aurora global */}
      <div className="auth-aurora" />
      <div className="auth-stars" />

      {/* Header */}
      <AdminHeader />

      {/* Tabs & content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList
            className="
              flex w-fit mx-auto
              rounded-2xl
              bg-white/10 backdrop-blur
              border border-white/20
              p-1.5 gap-2
              shadow-sm
            "
            aria-label="Navegación del panel"
          >
            <TabsTrigger
              value="home"
              className="
                rounded-xl px-6 py-3
                text-sm font-medium text-white/80
                data-[state=active]:bg-white/25
                data-[state=active]:text-white
                hover:bg-white/15
                transition-all
              "
            >
              Dashboard
            </TabsTrigger>

            <TabsTrigger
              value="colaboradores"
              className="
                rounded-xl px-6 py-3
                text-sm font-medium text-white/80
                data-[state=active]:bg-white/25
                data-[state=active]:text-white
                hover:bg-white/15
                transition-all
              "
            >
              Colaboradores
            </TabsTrigger>

            <TabsTrigger
              value="solicitudes"
              className="
                rounded-xl px-6 py-3
                text-sm font-medium text-white/80
                data-[state=active]:bg-white/25
                data-[state=active]:text-white
                hover:bg-white/15
                transition-all
              "
            >
              Solicitudes
            </TabsTrigger>
          </TabsList>


          <TabsContent value="home" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="colaboradores" className="space-y-6">
            <NegociosGrid />
          </TabsContent>

          <TabsContent value="solicitudes" className="space-y-6">
            <SolicitudesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}