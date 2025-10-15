"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { NegociosGrid } from "@/components/admin/NegociosGrid";
import { SolicitudesList } from "@/components/admin/SolicitudesList";
import { AdminHeader } from "./AdminHeader";

interface AdminDashboardProps { onLogout: () => void }

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "colaboradores" | "solicitudes">("home");

  return (
    <div className="min-h-screen dark bg-[#0a0d14] text-white auth-bg">
      {/* Aurora global */}
      <div className="auth-aurora" />

      {/* Header */}
      <AdminHeader />

      {/* Tabs & content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 glass border-white/20 bg-white/10">
            <TabsTrigger
              value="home"
              className="text-white data-[state=active]:bg-white/15 data-[state=active]:text-white rounded-xl"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="colaboradores"
              className="text-white data-[state=active]:bg-white/15 data-[state=active]:text-white rounded-xl"
            >
              Colaboradores
            </TabsTrigger>
            <TabsTrigger
              value="solicitudes"
              className="text-white data-[state=active]:bg-white/15 data-[state=active]:text-white rounded-xl"
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