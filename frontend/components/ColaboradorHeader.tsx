// components/ColaboradorHeader.tsx

/**
 * Componente: ColaboradorHeader
 * Descripción:
 *   Barra superior fija (sticky) para el panel de colaborador. Muestra el
 *   título del panel y un botón para cerrar sesión (form action -> logout).
 *
 * Características:
 *   - Estilos “glass / backdrop-blur” para integrarse con el look & feel global.
 *   - Mantiene la jerarquía visual con un icono/monograma y saludo.
 *   - Botón accesible con ícono (LogOut) y texto “Cerrar sesión”.
 *   - Usa acción de servidor `logout` desde '@/actions/login/auth'.
 *
 * Accesibilidad:
 *   - Contrastes y estados hover adecuados en botón.
 *   - Estructura semántica con <header>.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

"use client";

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/login/auth";

export function ColaboradorHeader() {
  return (
    <header className="sticky top-0 z-30 glass border border-white/20 backdrop-blur supports-[backdrop-filter]:bg-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow">
            <span className="text-white font-semibold">B</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Panel de Colaborador</h1>
            <p className="text-xs text-white/70">Hola, Colaborador</p>
          </div>
        </div>

        <form action={logout}>
          <Button variant="outline" type="submit" className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </header>
  );
}
