import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { caminoEnAjustes, INFO_RECURSO, type Recurso } from '@/lib/permisos';

type PantallaPreviaProps = {
  recurso: Recurso;
  bloqueado: boolean;
  /** Se llama al tocar "Continuar": recién ahí se muestra el diálogo del sistema. */
  onContinuar: () => Promise<unknown> | void;
  onAbrirAjustes: () => void;
};

/**
 * Pantalla previa al diálogo del sistema: beneficio en una frase, un único botón
 * y la aclaración de que se puede cambiar en Ajustes. Sin "Ahora no" ni "Cerrar" (pauta 5.1.1(iv)).
 * Si el permiso está bloqueado, explica el camino exacto en Ajustes y el botón pasa a "Abrir Ajustes".
 */
export function PantallaPrevia({ recurso, bloqueado, onContinuar, onAbrirAjustes }: PantallaPreviaProps) {
  const info = INFO_RECURSO[recurso];
  const [pidiendo, setPidiendo] = useState(false);

  async function continuar() {
    setPidiendo(true);
    try {
      await onContinuar();
    } finally {
      setPidiendo(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <ThemedText style={styles.icono}>{info.icono}</ThemedText>
      <ThemedText type="subtitle" style={styles.centrado}>
        {bloqueado ? `${info.nombre} desactivada` : info.nombre}
      </ThemedText>

      <ThemedText style={styles.centrado}>{info.beneficio}</ThemedText>

      {bloqueado ? (
        <>
          <ThemedText themeColor="textSecondary" style={styles.centrado}>
            Ya no podemos mostrarte el aviso del sistema. Para habilitarlo andá a:
          </ThemedText>
          <ThemedText type="code" style={styles.centrado}>
            {caminoEnAjustes(recurso)}
          </ThemedText>
          <Boton titulo="Abrir Ajustes" onPress={onAbrirAjustes} style={styles.boton} />
        </>
      ) : (
        <Boton
          titulo={pidiendo ? 'Esperando respuesta…' : 'Continuar'}
          disabled={pidiendo}
          onPress={continuar}
          style={styles.boton}
        />
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
        {bloqueado
          ? info.alternativa
          : `Podés cambiar esta decisión cuando quieras desde Ajustes. ${info.alternativa}`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    alignItems: 'stretch',
  },
  icono: {
    fontSize: 56,
    lineHeight: 68,
    textAlign: 'center',
  },
  centrado: {
    textAlign: 'center',
  },
  boton: {
    marginTop: Spacing.two,
  },
});
