import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { useReportes } from '@/lib/reportes';

/** Bandeja de avisos dentro de la app: la alternativa cuando no hay notificaciones. */
export default function Avisos() {
  const { avisos } = useReportes();

  return (
    <Pantalla>
      <ThemedText type="small" themeColor="textSecondary">
        Acá llegan siempre los avisos de tus reportes, aunque las notificaciones estén desactivadas.
      </ThemedText>

      {avisos.length === 0 ? (
        <Tarjeta>
          <ThemedText type="smallBold">No tenés avisos</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Cuando Mantenimiento resuelva uno de tus reportes, te avisamos acá.
          </ThemedText>
        </Tarjeta>
      ) : (
        avisos.map((aviso) => (
          <Link
            key={aviso.id}
            href={{ pathname: '/reporte/[id]', params: { id: aviso.reporteId } }}
            asChild>
            <Pressable>
              <Tarjeta>
                <ThemedText type="smallBold">✅ {aviso.titulo}</ThemedText>
                <ThemedText type="small">{aviso.mensaje}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(aviso.fecha).toLocaleTimeString()} ·{' '}
                  {aviso.notificado
                    ? 'También te llegó como notificación'
                    : 'Solo en la bandeja (notificaciones desactivadas)'}
                </ThemedText>
              </Tarjeta>
            </Pressable>
          </Link>
        ))
      )}
    </Pantalla>
  );
}
