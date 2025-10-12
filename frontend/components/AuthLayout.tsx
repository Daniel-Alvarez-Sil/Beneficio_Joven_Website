import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Fondo aurora / estrellas */}
      <div className="auth-aurora" />
      <div className="auth-stars" />

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          {/* Izquierda: Título/claim y logo (sin ícono manzana) */}
          <div className="order-2 md:order-1 flex flex-col justify-center">
            <div className="max-w-xl space-y-6">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-white/80">
                Beneficio Joven
              </h1>

              <p className="text-base md:text-lg text-white/80">
                Conecta tu negocio con miles de jóvenes. Administra promociones,
                solicitudes y colaboradores desde un panel elegante y sencillo.
              </p>

              <ul className="text-sm text-white/70 space-y-2">
                <li>• Registro de colaboradores en 2 pasos</li>
                <li>• Aprobación de solicitudes por administradores</li>
                <li>• Paneles separados para Administrador y Colaborador</li>
              </ul>

              <div className="w-full max-w-md">
                <ImageWithFallback
                  src="https://i.postimg.cc/RFm84vsD/beneficio-joven-logo.png"
                  alt="Beneficio Joven"
                  className="w-full h-auto object-contain opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Derecha: Card de vidrio tipo iCloud login */}
          <div className="order-1 md:order-2">
            <Card className="glass rounded-3xl border border-white/20">
              <CardContent className="p-8 md:p-10">
                <div className="text-center mb-6">
                  <h2 className="auth-title text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
                  {subtitle && (
                    <p className="auth-subtitle text-sm text-white/70 mt-2">{subtitle}</p>
                  )}
                </div>

                {children}

                <div className="mt-8 flex justify-center gap-4 text-xs text-white/60">
                  <button className="hover:text-white/85 hover:underline">Aviso de privacidad</button>
                  <span>•</span>
                  <button className="hover:text-white/85 hover:underline">Acerca de nosotros</button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
