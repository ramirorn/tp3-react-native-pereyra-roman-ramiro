import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { EtiquetaReporte } from '@/components/etiqueta';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useReportes } from '@/lib/reportes';

export default function Inicio() {
  const { reportes } = useReportes();

  return (
    <Pantalla>
      <Link href="/reporte/nuevo" asChild>
        <Boton titulo="＋ Nuevo reporte" />
      </Link>

      {reportes.length === 0 ? (
        <Tarjeta>
          <ThemedText type="smallBold">Todavía no reportaste nada</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ¿Viste una luz quemada, una canilla que pierde o un proyector roto? Tocá “Nuevo
            reporte” para avisarle a Mantenimiento.
          </ThemedText>
        </Tarjeta>
      ) : (
        reportes.map((reporte) => (
          <Link key={reporte.id} href={{ pathname: '/reporte/[id]', params: { id: reporte.id } }} asChild>
            <Pressable>
              <Tarjeta>
                <View style={styles.fila}>
                  <ThemedText type="smallBold" style={styles.titulo}>
                    {reporte.titulo}
                  </ThemedText>
                  <EtiquetaReporte estado={reporte.estado} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {reporte.categoria} · {reporte.aula || reporte.sector || 'sin lugar'}
                </ThemedText>
              </Tarjeta>
            </Pressable>
          </Link>
        ))
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titulo: {
    flex: 1,
  },
});
