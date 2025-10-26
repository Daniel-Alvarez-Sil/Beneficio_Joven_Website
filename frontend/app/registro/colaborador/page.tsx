// app/registro/colaborador/page.tsx
'use client';

/**
 * Página: /registro/colaborador
 * Descripción: Renderiza el formulario de registro para Administrador+Negocio.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Notas:
 * - `use client`: este componente se renderiza en el cliente.
 * - `RegisterAdminNegocioForm` encapsula la lógica de validación y envío.
 */

import { RegisterAdminNegocioForm } from '@/components/RegisterAdminNegocioForm';

export default function Page() {
  return <RegisterAdminNegocioForm />;
}
