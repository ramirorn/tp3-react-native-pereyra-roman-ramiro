import * as Location from 'expo-location';

import { esUbicacionAproximada } from '@/lib/permisos';

export type Ubicacion = { latitud: number; longitud: number; aproximada: boolean };

export const SECTORES = [
  'Patio',
  'Estacionamiento',
  'Pasillo',
  'Aulas',
  'Baños',
  'Biblioteca',
  'Laboratorio',
] as const;

/**
 * Devuelve la ubicación actual y si es aproximada (Android `accuracy: 'coarse'`,
 * iOS `accuracy: 'reduced'`). Solo usa primer plano. Si no hay permiso o falla, devuelve null.
 */
export async function obtenerUbicacion(): Promise<Ubicacion | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted) return null;

    const aproximada = esUbicacionAproximada(permiso);
    const posicion = await Location.getCurrentPositionAsync({
      accuracy: aproximada ? Location.Accuracy.Low : Location.Accuracy.Balanced,
    });

    return {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      aproximada,
    };
  } catch {
    // GPS apagado, timeout, etc.: el reporte se puede cargar igual con el sector a mano.
    return null;
  }
}
