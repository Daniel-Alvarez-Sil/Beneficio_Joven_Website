// app/registro/negocio/page.tsx
'use client';

/**
 * Página: /registro/negocio
 * Descripción: Renderiza el formulario de registro del Negocio.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Notas:
 * - `use client`: este componente se renderiza en el cliente.
 * - `RegisterNegocioForm` contiene la lógica de validación y envío del registro.
 */

import { RegisterNegocioForm } from '@/components/RegisterNegocioForm';

export default function Page() {
  return <RegisterNegocioForm />;
}
