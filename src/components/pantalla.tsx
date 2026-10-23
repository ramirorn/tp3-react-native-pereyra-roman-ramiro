import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Contenedor con scroll y fondo del tema para todas las pantallas. */
export function Pantalla({ contentContainerStyle, ...props }: ScrollViewProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.contenido, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  contenido: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
