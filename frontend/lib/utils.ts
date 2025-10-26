// lib/utils.ts

/**
 * Utilidad: `cn`
 * Descripción: Combina clases condicionales (via `clsx`) y resuelve conflictos de Tailwind
 *              (via `tailwind-merge`) en una sola función.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Uso:
 *   cn('px-2', isActive && 'text-white', 'px-4') // → 'text-white px-4'
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
