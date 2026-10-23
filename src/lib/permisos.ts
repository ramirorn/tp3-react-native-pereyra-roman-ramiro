import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { crearCanalReportes } from '@/lib/notificaciones';

export type Recurso = 'camara' | 'ubicacion' | 'notificaciones';

export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';

/** Lo mínimo que necesitamos de cualquier PermissionResponse de Expo. */
type Respuesta = {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
};

type Adaptador = {
  consultar: () => Promise<Respuesta>;
  pedir: () => Promise<Respuesta>;
  /** Devuelve una descripción del acceso parcial, o null si el acceso es completo. */
  parcial: (respuesta: Respuesta) => string | null;
};

export const RECURSOS: Recurso[] = ['camara', 'ubicacion', 'notificaciones'];

/** Textos de la pantalla previa: beneficio en una frase, molde "Usamos tu [dato] para [beneficio]". */
export const INFO_RECURSO: Record<
  Recurso,
  { nombre: string; icono: string; beneficio: string; alternativa: string; ajustes: string }
> = {
  camara: {
    nombre: 'Cámara',
    icono: '📷',
    beneficio:
      'Usamos tu cámara para leer el QR de la puerta del aula y sacar la foto del desperfecto.',
    alternativa: 'Si preferís no darla, podés escribir el código del aula y elegir una foto de la galería.',
    ajustes: 'Cámara',
  },
  ubicacion: {
    nombre: 'Ubicación',
    icono: '📍',
    beneficio:
      'Usamos tu ubicación para marcar en qué parte del instituto está el problema que reportás.',
    alternativa: 'Si preferís no darla, podés elegir el sector (patio, pasillo…) a mano.',
    ajustes: 'Ubicación',
  },
  notificaciones: {
    nombre: 'Notificaciones',
    icono: '🔔',
    beneficio: 'Usamos las notificaciones para avisarte cuando se resuelva tu reporte.',
    alternativa: 'Si preferís no darlas, los avisos igual te llegan a la bandeja "Avisos" de la app.',
    ajustes: 'Notificaciones',
  },
};

const adaptadores: Record<Recurso, Adaptador> = {
  camara: {
    // Son las mismas funciones que usa internamente useCameraPermissions().
    consultar: () => Camera.getCameraPermissionsAsync(),
    pedir: () => Camera.requestCameraPermissionsAsync(),
    parcial: () => null,
  },
  ubicacion: {
    consultar: () => Location.getForegroundPermissionsAsync(),
    pedir: () => Location.requestForegroundPermissionsAsync(),
    parcial: (respuesta) =>
      respuesta.granted && esUbicacionAproximada(respuesta as Location.LocationPermissionResponse)
        ? 'Ubicación aproximada'
        : null,
  },
  notificaciones: {
    consultar: () => Notifications.getPermissionsAsync(),
    pedir: async () => {
      // Android 13+: el diálogo de POST_NOTIFICATIONS aparece recién cuando existe un canal.
      await crearCanalReportes();
      return Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowProvisional: true },
      });
    },
    parcial: (respuesta) =>
      (respuesta as Notifications.NotificationPermissionsStatus).ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
        ? 'Provisional (llegan en silencio)'
        : null,
  },
};

export function esUbicacionAproximada(respuesta: Location.LocationPermissionResponse) {
  if (Platform.OS === 'android') return respuesta.android?.accuracy === 'coarse';
  if (Platform.OS === 'ios') return respuesta.ios?.accuracy === 'reduced';
  return false;
}

export type ResultadoPermiso = {
  estado: Exclude<EstadoPermiso, 'cargando'>;
  parcial: string | null;
  respuesta: Respuesta;
};

/**
 * Traduce una PermissionResponse a uno de los cuatro estados.
 * Lo deciden dos campos: `granted` (¿puedo usarlo?) y `canAskAgain` (¿puedo mostrar el diálogo?).
 */
function interpretar(recurso: Recurso, respuesta: Respuesta): ResultadoPermiso {
  const parcial = adaptadores[recurso].parcial(respuesta);
  // Las notificaciones provisionales de iOS no marcan granted, pero sí se pueden usar.
  if (respuesta.granted || parcial) return { estado: 'concedido', parcial, respuesta };
  if (respuesta.canAskAgain) return { estado: 'preguntable', parcial: null, respuesta };
  return { estado: 'bloqueado', parcial: null, respuesta };
}

export async function consultarPermiso(recurso: Recurso) {
  return interpretar(recurso, await adaptadores[recurso].consultar());
}

export async function pedirPermiso(recurso: Recurso) {
  return interpretar(recurso, await adaptadores[recurso].pedir());
}

/** Camino exacto en Ajustes para habilitar un permiso bloqueado, según la plataforma. */
export function caminoEnAjustes(recurso: Recurso) {
  const permiso = INFO_RECURSO[recurso].ajustes;
  if (Platform.OS === 'ios') {
    return `Ajustes › Mantenimiento IPF › ${permiso} › activalo`;
  }
  return `Ajustes › Apps › Mantenimiento IPF › Permisos › ${permiso} › Permitir`;
}
