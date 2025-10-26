// components/AdminHeader.tsx
"use client";

/**
 * Componente: AdminHeader
 * Descripción: Encabezado fijo del panel de administración con branding mínimo
 *              y botón para cerrar sesión (usa acción `logout` del lado del servidor).
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/login/auth";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 glass border border-white/20 backdrop-blur supports-[backdrop-filter]:bg-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow">
            <span className="text-white font-semibold">A</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Panel de Administrador</h1>
            <p className="text-xs text-white/70">Hola, Administrador</p>
          </div>
        </div>

        <form action={logout}>
          <Button
            variant="outline"
            type="submit"
            className="gap-2 btn-apple btn-gradient text-white border-white/20 bg-transparent hover:brightness-110"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </header>
  );
}
