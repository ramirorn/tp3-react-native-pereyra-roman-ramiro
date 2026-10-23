import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CANAL_REPORTES = 'reportes';

// Mostrar la notificación también si la app está abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** En Android hay que crear el canal antes de pedir el permiso (si no, no aparece el diálogo). */
export async function crearCanalReportes() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_REPORTES, {
    name: 'Reportes',
    description: 'Avisos cuando cambia el estado de tus reportes',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function programarAvisoDeResolucion(titulo: string, segundos: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reporte resuelto ✅',
      body: `"${titulo}" ya fue resuelto por Mantenimiento.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: segundos,
      channelId: CANAL_REPORTES,
    },
  });
}
