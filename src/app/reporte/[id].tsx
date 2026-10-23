import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { EtiquetaReporte } from '@/components/etiqueta';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { SEGUNDOS_RESOLUCION, useReportes } from '@/lib/reportes';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText>{valor}</ThemedText>
    </View>
  );
}

export default function DetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reportes, simularResolucion, avisarAlResolver } = useReportes();
  const reporte = typeof id === 'string' ? reportes.find((r) => r.id === id) : undefined;

  if (!reporte) {
    return (
      <Pantalla>
        <Tarjeta>
          <ThemedText type="smallBold">Reporte no encontrado</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            No existe ningún reporte con el id “{String(id)}”. Puede que se haya borrado o que el
            enlace esté mal.
          </ThemedText>
        </Tarjeta>
        <Link href="/" asChild>
          <Boton variante="secundario" titulo="Ir a mis reportes" />
        </Link>
      </Pantalla>
    );
  }

  const lugar = reporte.ubicacion
    ? reporte.ubicacion.aproximada
      ? 'Ubicación aproximada'
      : `${reporte.ubicacion.latitud.toFixed(5)}, ${reporte.ubicacion.longitud.toFixed(5)}`
    : null;

  return (
    <Pantalla>
      <View style={styles.encabezado}>
        <ThemedText type="subtitle" style={styles.titulo}>
          {reporte.titulo}
        </ThemedText>
        <EtiquetaReporte estado={reporte.estado} />
      </View>

      {reporte.fotoUri && (
        <Image source={{ uri: reporte.fotoUri }} style={styles.foto} contentFit="cover" />
      )}

      <Tarjeta>
        <Dato etiqueta="Descripción" valor={reporte.descripcion || '—'} />
        <Dato etiqueta="Aula" valor={reporte.aula || '—'} />
        <Dato etiqueta="Categoría" valor={reporte.categoria} />
        <Dato etiqueta="Ubicación" valor={lugar ?? 'Sin ubicación'} />
        <Dato etiqueta="Sector" valor={reporte.sector ?? '—'} />
        <Dato etiqueta="Creado" valor={new Date(reporte.creado).toLocaleString()} />
      </Tarjeta>

      {reporte.estado === 'pendiente' && (
        <Tarjeta>
          <ThemedText type="smallBold">🧪 Prueba</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Simula que Mantenimiento resuelve el reporte en {SEGUNDOS_RESOLUCION} segundos.{' '}
            {avisarAlResolver
              ? 'Si las notificaciones están permitidas, te llega una; si no, el aviso queda en la bandeja.'
              : 'Los avisos están desactivados en Ajustes de la app: el aviso queda en la bandeja.'}
          </ThemedText>
          <Boton titulo="Simular resolución" onPress={() => simularResolucion(reporte.id)} />
        </Tarjeta>
      )}
      {reporte.estado === 'en curso' && (
        <ThemedText type="small" themeColor="textSecondary">
          Mantenimiento está trabajando… se resuelve en {SEGUNDOS_RESOLUCION} segundos.
        </ThemedText>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    gap: Spacing.two,
  },
  titulo: {
    fontSize: 26,
    lineHeight: 32,
  },
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  dato: {
    gap: Spacing.half,
  },
});
