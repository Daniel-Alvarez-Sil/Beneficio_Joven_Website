import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-46 h-46 mx-auto flex items-center justify-center">
              <ImageWithFallback 
                src="https://i.postimg.cc/RFm84vsD/beneficio-joven-logo.png"
                alt="Beneficio Joven" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Beneficio Joven</h1>
            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
          </div>

          <h2 className="text-xl font-semibold text-center mb-6">{title}</h2>
          
          {children}

          {/* Footer */}
          <div className="mt-8 flex justify-center gap-4">
            <div className="text-xs text-gray-500">Aviso de privacidad</div>
            <div className="text-xs text-gray-500">Acerca de nosotros</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}