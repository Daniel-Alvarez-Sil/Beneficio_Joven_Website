"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { NegociosGrid } from "@/components/admin/NegociosGrid";
import { SolicitudesList } from "@/components/admin/SolicitudesList";
import { AdminHeader } from "./AdminHeader";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "colaboradores" | "solicitudes">("home");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader />

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home">Dashboard</TabsTrigger>
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
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
