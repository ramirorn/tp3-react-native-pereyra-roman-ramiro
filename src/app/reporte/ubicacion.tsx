import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { PantallaPrevia } from '@/components/pantalla-previa';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Colores, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePermiso } from '@/hooks/usePermiso';
import { useReportes } from '@/lib/reportes';
import { obtenerUbicacion, SECTORES, type Ubicacion } from '@/lib/ubicacion';

export default function MarcarUbicacion() {
  const router = useRouter();
  const theme = useTheme();
  const { borrador, actualizarBorrador } = useReportes();
  const { estado, parcial, pedir, abrirAjustes } = usePermiso('ubicacion');
  // null mientras se busca; { ubicacion: null } si no se pudo obtener.
  const [lectura, setLectura] = useState<{ ubicacion: Ubicacion | null } | null>(null);
  const [sector, setSector] = useState(borrador.sector);

  // Con el permiso concedido (solo primer plano) buscamos la posición actual.
  useEffect(() => {
    if (estado !== 'concedido') return;
    let activo = true;
    obtenerUbicacion().then((ubicacion) => {
      if (activo) setLectura({ ubicacion });
    });
    return () => {
      activo = false;
    };
  }, [estado, parcial]);

  const buscando = estado === 'concedido' && lectura === null;
  const ubicacion = lectura?.ubicacion ?? null;

  function guardar() {
    actualizarBorrador({ ubicacion: estado === 'concedido' ? ubicacion : null, sector });
    router.back();
  }

  return (
    <Pantalla>
      {estado === 'cargando' && <ActivityIndicator size="large" />}

      {estado === 'concedido' && (
        <Tarjeta>
          <ThemedText type="smallBold">📍 Tu ubicación actual</ThemedText>
          {buscando ? (
            <ActivityIndicator />
          ) : ubicacion ? (
            // Si es aproximada no mostramos coordenadas: no serían exactas.
            <ThemedText>
              {ubicacion.aproximada
                ? 'Ubicación aproximada'
                : `${ubicacion.latitud.toFixed(5)}, ${ubicacion.longitud.toFixed(5)}`}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No pudimos obtener la ubicación (¿GPS apagado?). Elegí el sector a mano.
            </ThemedText>
          )}
          {ubicacion?.aproximada && (
            <ThemedText type="small" themeColor="textSecondary">
              Elegiste ubicación aproximada: alcanza para saber la zona; sumá el sector para que
              Mantenimiento lo encuentre más rápido.
            </ThemedText>
          )}
        </Tarjeta>
      )}

      {(estado === 'preguntable' || estado === 'bloqueado') && (
        <PantallaPrevia
          recurso="ubicacion"
          bloqueado={estado === 'bloqueado'}
          onContinuar={pedir}
          onAbrirAjustes={abrirAjustes}
        />
      )}

      {/* Alternativa: el sector elegido a mano, siempre disponible. */}
      <Tarjeta>
        <ThemedText type="smallBold">Sector del instituto</ThemedText>
        <View style={styles.chips}>
          {SECTORES.map((opcion) => {
            const elegido = sector === opcion;
            return (
              <Pressable
                key={opcion}
                onPress={() => setSector(elegido ? null : opcion)}
                style={[
                  styles.chip,
                  { backgroundColor: elegido ? Colores.primario : theme.background },
                ]}>
                <ThemedText type="small" style={elegido && { color: '#ffffff' }}>
                  {opcion}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Tarjeta>

      <Boton
        titulo="Guardar lugar"
        disabled={!sector && !(estado === 'concedido' && ubicacion)}
        onPress={guardar}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
});
