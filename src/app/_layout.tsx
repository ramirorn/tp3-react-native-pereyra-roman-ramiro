import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ReportesProvider } from '@/lib/reportes';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ReportesProvider>
        <Stack screenOptions={{ headerBackTitle: 'Volver' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="reporte/nuevo" options={{ title: 'Nuevo reporte' }} />
          <Stack.Screen name="reporte/escanear" options={{ title: 'Escanear QR del aula' }} />
          <Stack.Screen name="reporte/foto" options={{ title: 'Foto del desperfecto' }} />
          <Stack.Screen name="reporte/ubicacion" options={{ title: 'Ubicación del problema' }} />
          <Stack.Screen name="reporte/[id]" options={{ title: 'Detalle del reporte' }} />
          <Stack.Screen
            name="permisos/[recurso]"
            options={{ presentation: 'modal', title: 'Antes de continuar' }}
          />
          <Stack.Screen name="ajustes-app" options={{ title: 'Ajustes de la app' }} />
        </Stack>
      </ReportesProvider>
    </ThemeProvider>
  );
}
