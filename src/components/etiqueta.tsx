import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colores, Spacing } from '@/constants/theme';
import type { EstadoPermiso } from '@/lib/permisos';
import type { EstadoReporte } from '@/lib/reportes';

const COLOR_REPORTE: Record<EstadoReporte, string> = {
  pendiente: Colores.pendiente,
  'en curso': Colores.enCurso,
  resuelto: Colores.resuelto,
};

const PERMISO: Record<EstadoPermiso, { texto: string; color: string }> = {
  cargando: { texto: 'Consultando…', color: '#6B7280' },
  concedido: { texto: 'Concedido', color: Colores.resuelto },
  preguntable: { texto: 'Preguntable', color: Colores.pendiente },
  bloqueado: { texto: 'Bloqueado', color: Colores.bloqueado },
};

function Etiqueta({ texto, color }: { texto: string; color: string }) {
  return (
    <View style={[styles.etiqueta, { backgroundColor: color + '22', borderColor: color }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {texto}
      </ThemedText>
    </View>
  );
}

export function EtiquetaReporte({ estado }: { estado: EstadoReporte }) {
  return <Etiqueta texto={estado} color={COLOR_REPORTE[estado]} />;
}

export function EtiquetaPermiso({ estado, parcial }: { estado: EstadoPermiso; parcial?: boolean }) {
  if (parcial) return <Etiqueta texto="Parcial" color={Colores.enCurso} />;
  return <Etiqueta {...PERMISO[estado]} />;
}

const styles = StyleSheet.create({
  etiqueta: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
});
