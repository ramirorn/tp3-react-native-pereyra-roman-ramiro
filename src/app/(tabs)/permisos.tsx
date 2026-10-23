import { useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { EtiquetaPermiso } from '@/components/etiqueta';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePermiso } from '@/hooks/usePermiso';
import { INFO_RECURSO, RECURSOS, type Recurso } from '@/lib/permisos';

/** Detalle técnico de la respuesta: el "matiz" que no se ve en status. */
function matiz(respuesta: Record<string, any> | null) {
  if (!respuesta) return null;
  const partes: string[] = [`status: ${respuesta.status}`, `canAskAgain: ${respuesta.canAskAgain}`];
  if (respuesta.accessPrivileges) partes.push(`accessPrivileges: ${respuesta.accessPrivileges}`);
  if (respuesta.android?.accuracy) partes.push(`android.accuracy: ${respuesta.android.accuracy}`);
  if (respuesta.ios?.accuracy) partes.push(`ios.accuracy: ${respuesta.ios.accuracy}`);
  if (respuesta.ios?.scope) partes.push(`ios.scope: ${respuesta.ios.scope}`);
  if (typeof respuesta.ios?.status === 'number') partes.push(`ios.status: ${respuesta.ios.status}`);
  return partes.join(' · ');
}

function FilaPermiso({ recurso }: { recurso: Recurso }) {
  const router = useRouter();
  const { estado, parcial, respuesta, abrirAjustes } = usePermiso(recurso);
  const info = INFO_RECURSO[recurso];

  return (
    <Tarjeta>
      <View style={styles.fila}>
        <ThemedText type="smallBold" style={styles.nombre}>
          {info.icono} {info.nombre}
        </ThemedText>
        <EtiquetaPermiso estado={estado} parcial={!!parcial} />
      </View>

      {parcial && <ThemedText type="small">{parcial}</ThemedText>}
      <ThemedText type="code" themeColor="textSecondary">
        {matiz(respuesta)}
      </ThemedText>

      {estado === 'preguntable' && (
        <Boton
          variante="secundario"
          titulo="Pedir permiso"
          onPress={() => router.push({ pathname: '/permisos/[recurso]', params: { recurso } })}
        />
      )}
      {estado === 'bloqueado' && (
        <Boton variante="secundario" titulo="Abrir Ajustes" onPress={abrirAjustes} />
      )}
    </Tarjeta>
  );
}

export default function Permisos() {
  return (
    <Pantalla>
      <ThemedText type="small" themeColor="textSecondary">
        Plataforma: <ThemedText type="code">{Platform.OS}</ThemedText> · Se actualiza al volver de
        Ajustes.
      </ThemedText>

      {RECURSOS.map((recurso) => (
        <FilaPermiso key={recurso} recurso={recurso} />
      ))}

      <Tarjeta>
        <View style={styles.fila}>
          <ThemedText type="smallBold" style={styles.nombre}>
            🖼️ Galería
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            No se pide
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          No hace falta: elegimos las fotos con el selector del sistema, que no pide permiso. La app
          no declara READ_MEDIA_IMAGES ni accede a tu galería.
        </ThemedText>
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nombre: {
    flex: 1,
  },
});
