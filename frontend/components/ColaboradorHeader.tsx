"use client";

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/login/auth";

export function ColaboradorHeader() {
    return (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
    <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-white font-bold">B</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight">
            Panel de Colaborador
          </h1>
          <p className="text-xs text-muted-foreground">Hola, Colaborador</p>
        </div>
      </div>

      <form action={logout}>
        <Button variant="outline" type="submit" className="gap-2">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </form>
    </div>
  </header>);
}
