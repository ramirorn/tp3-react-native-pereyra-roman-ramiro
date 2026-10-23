import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { useConPermiso } from '@/hooks/useConPermiso';
import { useReportes } from '@/lib/reportes';

const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
  allowsEditing: true,
};

export default function Foto() {
  const router = useRouter();
  const { borrador, actualizarBorrador } = useReportes();
  const camara = useConPermiso('camara');
  const [uri, setUri] = useState(borrador.fotoUri);

  async function sacarFoto() {
    try {
      const resultado = await ImagePicker.launchCameraAsync(OPCIONES);
      if (!resultado.canceled) setUri(resultado.assets[0].uri);
    } catch {
      Alert.alert('No se pudo abrir la cámara', 'Probá elegir la foto desde la galería.');
    }
  }

  // Selector del sistema: la persona elige la foto y la app solo recibe esa. No pide permiso.
  async function elegirDeGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
    if (!resultado.canceled) setUri(resultado.assets[0].uri);
  }

  function usarFoto() {
    actualizarBorrador({ fotoUri: uri });
    router.back();
  }

  return (
    <Pantalla>
      {uri ? (
        <Image source={{ uri }} style={styles.foto} contentFit="cover" />
      ) : (
        <Tarjeta>
          <ThemedText type="small" themeColor="textSecondary">
            Sacá una foto del desperfecto o elegí una que ya tengas.
          </ThemedText>
        </Tarjeta>
      )}

      <Boton variante="secundario" titulo="📷 Sacar foto" onPress={() => camara.usar(sacarFoto)} />
      {camara.estado === 'bloqueado' && (
        <ThemedText type="small" themeColor="textSecondary">
          La cámara está desactivada: podés elegir la foto de la galería.
        </ThemedText>
      )}
      <Boton variante="secundario" titulo="🖼️ Elegir de la galería" onPress={elegirDeGaleria} />
      <ThemedText type="small" themeColor="textSecondary">
        Elegir de la galería no necesita permiso: solo compartís la foto que seleccionás.
      </ThemedText>

      {uri && <Boton titulo="Usar esta foto" onPress={usarFoto} />}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
});
