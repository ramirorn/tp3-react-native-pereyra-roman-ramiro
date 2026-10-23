import { useRouter, type Href } from 'expo-router';

import { usePermiso } from '@/hooks/usePermiso';
import type { Recurso } from '@/lib/permisos';

/**
 * Ejecuta una acción que necesita un permiso. Si todavía no está concedido, abre la
 * pantalla previa /permisos/[recurso]; el diálogo del sistema se muestra recién ahí,
 * al tocar "Continuar". Como solo se llama al tocar la función, nunca se insiste solo.
 *
 * `siguiente`: ruta a la que ir después de la pantalla previa (se conceda o no;
 * esa ruta tiene su propia alternativa para cuando se deniega).
 */
export function useConPermiso(recurso: Recurso) {
  const permiso = usePermiso(recurso);
  const router = useRouter();

  function usar(accion: () => void, siguiente?: string) {
    if (permiso.estado === 'concedido') {
      accion();
      return;
    }
    // Bloqueado: no hay diálogo que mostrar. La pantalla de la función ya ofrece
    // "Abrir Ajustes" y la alternativa manual.
    if (permiso.estado === 'bloqueado' && siguiente) {
      router.push(siguiente as Href);
      return;
    }
    router.push({
      pathname: '/permisos/[recurso]',
      params: siguiente ? { recurso, siguiente } : { recurso },
    });
  }

  return { ...permiso, usar };
}
