import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import {
  consultarPermiso,
  pedirPermiso,
  type EstadoPermiso,
  type Recurso,
  type ResultadoPermiso,
} from '@/lib/permisos';

/**
 * Hook unificado de permisos.
 *
 * - `estado`: 'cargando' | 'concedido' | 'preguntable' | 'bloqueado'
 * - `parcial`: texto del acceso parcial (ubicación aproximada, notificaciones provisionales) o null
 * - `pedir()`: muestra el diálogo del sistema (solo llamarlo desde una acción de la persona)
 * - `abrirAjustes()`: abre la pantalla de la app en Ajustes
 *
 * Se vuelve a consultar al enfocar la pantalla y al volver a primer plano (AppState).
 */
export function usePermiso(recurso: Recurso) {
  const [resultado, setResultado] = useState<ResultadoPermiso | null>(null);

  const consultar = useCallback(() => {
    consultarPermiso(recurso)
      .then(setResultado)
      .catch(() => setResultado(null));
  }, [recurso]);

  useFocusEffect(consultar);
  useRevisarAlVolver(consultar);

  const pedir = useCallback(async () => {
    const nuevo = await pedirPermiso(recurso);
    setResultado(nuevo);
    return nuevo;
  }, [recurso]);

  const abrirAjustes = useCallback(() => Linking.openSettings(), []);

  const estado: EstadoPermiso = resultado?.estado ?? 'cargando';

  return {
    estado,
    parcial: resultado?.parcial ?? null,
    respuesta: resultado?.respuesta ?? null,
    pedir,
    abrirAjustes,
    consultar,
  };
}
