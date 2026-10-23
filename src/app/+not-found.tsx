import { Link, Stack } from 'expo-router';

import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';

export default function NoEncontrada() {
  return (
    <Pantalla>
      <Stack.Screen options={{ title: 'No encontrada' }} />
      <ThemedText type="subtitle">Esta pantalla no existe</ThemedText>
      <Link href="/" asChild>
        <Boton titulo="Ir a mis reportes" />
      </Link>
    </Pantalla>
  );
}
