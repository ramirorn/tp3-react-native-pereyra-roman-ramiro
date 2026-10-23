import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Colores, Spacing } from '@/constants/theme';
import { useConPermiso } from '@/hooks/useConPermiso';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORIAS, useReportes } from '@/lib/reportes';

/** Formulario del reporte. No pide ningún permiso al abrir: cada uno se pide al tocar su función. */
export default function NuevoReporte() {
  const router = useRouter();
  const theme = useTheme();
  const { borrador, actualizarBorrador, guardarBorrador } = useReportes();
  const camara = useConPermiso('camara');
  const ubicacion = useConPermiso('ubicacion');

  const estiloInput = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  function guardar() {
    if (!borrador.titulo.trim()) {
      Alert.alert('Falta el título', 'Contanos en pocas palabras qué pasó.');
      return;
    }
    const reporte = guardarBorrador();
    router.replace({ pathname: '/reporte/[id]', params: { id: reporte.id } });
  }

  return (
    <Pantalla>
      <View style={styles.campo}>
        <ThemedText type="smallBold">Título</ThemedText>
        <TextInput
          style={estiloInput}
          placeholder="Ej.: Luz quemada"
          placeholderTextColor={theme.textSecondary}
          value={borrador.titulo}
          onChangeText={(titulo) => actualizarBorrador({ titulo })}
        />
      </View>

      <View style={styles.campo}>
        <ThemedText type="smallBold">Descripción</ThemedText>
        <TextInput
          style={[estiloInput, styles.multilinea]}
          placeholder="¿Qué pasa y desde cuándo?"
          placeholderTextColor={theme.textSecondary}
          multiline
          value={borrador.descripcion}
          onChangeText={(descripcion) => actualizarBorrador({ descripcion })}
        />
      </View>

      <View style={styles.campo}>
        <ThemedText type="smallBold">Aula</ThemedText>
        <View style={styles.fila}>
          <TextInput
            style={[estiloInput, styles.flex]}
            placeholder="Ej.: A-12"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            value={borrador.aula}
            onChangeText={(aula) => actualizarBorrador({ aula })}
          />
          <Boton
            variante="secundario"
            titulo="📷 Escanear QR"
            onPress={() =>
              camara.usar(() => router.push('/reporte/escanear'), '/reporte/escanear')
            }
          />
        </View>
      </View>

      <View style={styles.campo}>
        <ThemedText type="smallBold">Categoría</ThemedText>
        <View style={styles.chips}>
          {CATEGORIAS.map((categoria) => {
            const elegida = borrador.categoria === categoria;
            return (
              <Pressable
                key={categoria}
                onPress={() => actualizarBorrador({ categoria })}
                style={[
                  styles.chip,
                  { backgroundColor: elegida ? Colores.primario : theme.backgroundElement },
                ]}>
                <ThemedText type="small" style={elegida && { color: '#ffffff' }}>
                  {categoria}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Tarjeta>
        <ThemedText type="smallBold">Foto</ThemedText>
        {borrador.fotoUri ? (
          <Image source={{ uri: borrador.fotoUri }} style={styles.foto} contentFit="cover" />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Sin foto adjunta.
          </ThemedText>
        )}
        <Boton
          variante="secundario"
          titulo={borrador.fotoUri ? 'Cambiar foto' : '🖼️ Adjuntar foto'}
          onPress={() => router.push('/reporte/foto')}
        />
      </Tarjeta>

      <Tarjeta>
        <ThemedText type="smallBold">Lugar</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {borrador.ubicacion
            ? borrador.ubicacion.aproximada
              ? 'Ubicación aproximada'
              : `${borrador.ubicacion.latitud.toFixed(5)}, ${borrador.ubicacion.longitud.toFixed(5)}`
            : 'Sin ubicación marcada.'}
          {borrador.sector ? ` · Sector: ${borrador.sector}` : ''}
        </ThemedText>
        <Boton
          variante="secundario"
          titulo="📍 Marcar ubicación"
          onPress={() =>
            ubicacion.usar(() => router.push('/reporte/ubicacion'), '/reporte/ubicacion')
          }
        />
      </Tarjeta>

      <Boton titulo="Enviar reporte" onPress={guardar} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  multilinea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
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
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
});
