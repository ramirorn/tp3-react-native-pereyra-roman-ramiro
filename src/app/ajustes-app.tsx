import { useRouter } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { Boton } from '@/components/boton';
import { EtiquetaPermiso } from '@/components/etiqueta';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePermiso } from '@/hooks/usePermiso';
import { useReportes } from '@/lib/reportes';

export default function AjustesApp() {
  const router = useRouter();
  const { avisarAlResolver, setAvisarAlResolver } = useReportes();
  const { estado, parcial, abrirAjustes } = usePermiso('notificaciones');

  // El permiso se pide únicamente acá, al activar el interruptor (y pasando por la pantalla previa).
  function cambiar(valor: boolean) {
    setAvisarAlResolver(valor);
    if (valor && estado !== 'concedido') {
      router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'notificaciones' } });
    }
  }

  return (
    <Pantalla>
      <Tarjeta>
        <View style={styles.fila}>
          <ThemedText style={styles.flex}>Avisarme cuando se resuelva mi reporte</ThemedText>
          <Switch value={avisarAlResolver} onValueChange={cambiar} />
        </View>
        <View style={styles.fila}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            Permiso de notificaciones
          </ThemedText>
          <EtiquetaPermiso estado={estado} parcial={!!parcial} />
        </View>
        {parcial && <ThemedText type="small">{parcial}</ThemedText>}
      </Tarjeta>

      {avisarAlResolver && estado !== 'concedido' && estado !== 'cargando' && (
        <Tarjeta>
          <ThemedText type="small">
            Las notificaciones no están permitidas, así que los avisos te van a llegar a la bandeja
            “Avisos” de la app.
          </ThemedText>
          {estado === 'bloqueado' ? (
            <Boton variante="secundario" titulo="Abrir Ajustes" onPress={abrirAjustes} />
          ) : (
            <Boton
              variante="secundario"
              titulo="Permitir notificaciones"
              onPress={() =>
                router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'notificaciones' } })
              }
            />
          )}
        </Tarjeta>
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
  flex: {
    flex: 1,
  },
});
