// app/registro/gracias/page.tsx
'use client'

/**
 * Página: /registro/gracias
 * Descripción: Pantalla de confirmación posterior al envío de la solicitud.
 *              Informa al usuario que un administrador revisará la petición.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Notas:
 * - `use client`: componente renderizado en el cliente.
 * - UI minimalista centrada vertical y horizontalmente.
 */

export default function GraciasPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">¡Solicitud enviada!</h1>
        <p className="text-gray-600">
          Un administrador revisará tu solicitud y te notificará cuando sea aprobada.
        </p>
      </div>
    </div>
  );
}
