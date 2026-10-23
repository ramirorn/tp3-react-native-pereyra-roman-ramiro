import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function Tarjeta({ style, ...props }: ViewProps) {
  return <ThemedView type="backgroundElement" style={[styles.tarjeta, style]} {...props} />;
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.two,
  },
});
