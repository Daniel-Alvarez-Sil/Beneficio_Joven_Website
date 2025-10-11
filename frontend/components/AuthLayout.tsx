import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen auth-bg flex items-center">
      {/* fondo decorativo */}
      <div className="bg-dots absolute inset-0 pointer-events-none" />

      <div className="container mx-auto px-4 py-10">
        <div className="grid items-stretch gap-8 md:grid-cols-2">
          {/* Columna derecha: Card con el formulario */}
          <div className="order-2 md:order-2">
            <Card className="glass border border-border/60 rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
                  )}
                </div>

                {children}

                <div className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground">
                  <div className="cursor-pointer hover:underline">Aviso de privacidad</div>
                  <div className="cursor-pointer hover:underline">Acerca de nosotros</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna izquierda: Texto arriba, imagen abajo (sin card blanca) */}
          <div className="order-1 md:order-1 flex flex-col justify-center">
            <div className="max-w-xl">
              {/* Texto / claims */}
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Beneficio Joven
              </h1>
              <p className="mt-3 text-muted-foreground text-base md:text-lg">
                Conecta tu negocio con miles de jóvenes. Administra promociones,
                solicitudes y colaboradores desde un panel elegante y sencillo.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-foreground/80">
                <li>• Registro de colaboradores en 2 pasos</li>
                <li>• Aprobación de solicitudes por administradores</li>
                <li>• Paneles separados para Administrador y Colaborador</li>
              </ul>

              {/* Logo debajo, sin fondo blanco */}
              <div className="mt-8">
                <div className="w-full aspect-[5/3]">
                  <ImageWithFallback
                    src="https://i.postimg.cc/RFm84vsD/beneficio-joven-logo.png"
                    alt="Beneficio Joven"
                    className="w-full h-full object-contain bg-transparent"
                  />
                </div>
              </div>

              {/* Si prefieres aún más limpio sin borde ni blur:
                  Reemplaza el div anterior por:
                  <div className="mt-8">
                    <ImageWithFallback ... className="w-full h-auto object-contain" />
                  </div>
              */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
