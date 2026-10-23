import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colores, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BotonProps = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: 'primario' | 'secundario';
};

export function Boton({ titulo, variante = 'primario', style, disabled, ...props }: BotonProps) {
  const theme = useTheme();
  const primario = variante === 'primario';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(estado) => [
        styles.boton,
        primario
          ? { backgroundColor: Colores.primario }
          : { backgroundColor: theme.backgroundElement },
        (estado.pressed || disabled) && styles.apagado,
        typeof style === 'function' ? style(estado) : style,
      ]}
      {...props}>
      <ThemedText style={[styles.texto, primario && { color: '#ffffff' }]}>{titulo}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
  texto: {
    fontWeight: 600,
  },
  apagado: {
    opacity: 0.6,
  },
});
