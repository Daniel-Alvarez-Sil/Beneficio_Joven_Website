// hooks/use-mobile.ts

/**
 * Hook: useIsMobile
 * Descripción: Detecta si el viewport actual corresponde a un dispositivo "móvil"
 *              comparando el ancho de la ventana contra un breakpoint.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Detalles:
 * - Usa `matchMedia` para escuchar cambios de tamaño y actualizar el estado.
 * - Retorna un booleano indicando si el viewport es menor al breakpoint móvil.
 * - Inicializa el estado con `undefined` y lo normaliza a booleano al retornar.
 *
 * Notas:
 * - `MOBILE_BREAKPOINT` define el ancho (en px) a partir del cual se considera "desktop".
 * - El listener se limpia en el `return` del `useEffect` para evitar fugas.
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // `undefined` inicialmente para diferenciar antes/después de montar
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // MediaQueryList para monitorear cambios respecto al breakpoint móvil
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Actualiza el estado comparando el ancho actual con el breakpoint
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Suscripción a cambios del media query y set inicial
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Limpieza del listener al desmontar
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Normaliza a booleano (false si aún no se calculó)
  return !!isMobile
}
