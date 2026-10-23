import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { PantallaPrevia } from '@/components/pantalla-previa';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePermiso } from '@/hooks/usePermiso';
import { useReportes } from '@/lib/reportes';

/** El QR de la puerta puede traer "IPF-AULA:A-12" o directamente "A-12". */
function aulaDesdeQr(datos: string) {
  const texto = datos.trim();
  const marca = texto.toUpperCase().indexOf('AULA:');
  return (marca >= 0 ? texto.slice(marca + 'AULA:'.length) : texto).trim().toUpperCase();
}

export default function Escanear() {
  const router = useRouter();
  const theme = useTheme();
  const { borrador, actualizarBorrador } = useReportes();
  const { estado, pedir, abrirAjustes } = usePermiso('camara');
  const [codigo, setCodigo] = useState(borrador.aula);
  const leido = useRef(false);

  function usarAula(aula: string) {
    actualizarBorrador({ aula });
    router.back();
  }

  function alEscanear({ data }: BarcodeScanningResult) {
    // onBarcodeScanned se dispara muchas veces por segundo: nos quedamos con la primera lectura.
    if (leido.current) return;
    leido.current = true;
    usarAula(aulaDesdeQr(data));
  }

  // Alternativa: escribir el código a mano. Siempre disponible, haya permiso o no.
  const aMano = (
    <Tarjeta>
      <ThemedText type="smallBold">
        {estado === 'concedido' ? '¿No lee el QR? Escribilo a mano' : 'Escribí el código del aula'}
      </ThemedText>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        placeholder="Ej.: A-12"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="characters"
        value={codigo}
        onChangeText={setCodigo}
      />
      <Boton
        variante="secundario"
        titulo="Usar este código"
        disabled={!codigo.trim()}
        onPress={() => usarAula(codigo.trim().toUpperCase())}
      />
    </Tarjeta>
  );

  // 1. Cargando: todavía no sabemos el estado (la respuesta es null).
  if (estado === 'cargando') {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <ThemedText type="small">Revisando el permiso de cámara…</ThemedText>
      </View>
    );
  }

  // 2. Concedido: mostramos la cámara.
  if (estado === 'concedido') {
    return (
      <Pantalla>
        <View style={styles.visor}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={alEscanear}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
          Apuntá al código QR pegado en la puerta del aula.
        </ThemedText>
        {aMano}
      </Pantalla>
    );
  }

  // 3. Preguntable → explicación con "Continuar".  4. Bloqueado → "Abrir Ajustes".
  return (
    <Pantalla>
      <PantallaPrevia
        recurso="camara"
        bloqueado={estado === 'bloqueado'}
        onContinuar={pedir}
        onAbrirAjustes={abrirAjustes}
      />
      {aMano}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  visor: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  centrado: {
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
});
