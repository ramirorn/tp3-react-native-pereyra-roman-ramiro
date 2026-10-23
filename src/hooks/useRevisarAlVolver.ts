import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Llama a `revisar` cada vez que la app vuelve a primer plano (por ejemplo, al volver de Ajustes).
 * Los hooks de Expo no se enteran solos: el sistema no avisa cuando un permiso cambia afuera.
 */
export function useRevisarAlVolver(revisar: () => void) {
  const anterior = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera = /inactive|background/.test(anterior.current);
      if (estabaAfuera && nuevo === 'active') revisar();
      anterior.current = nuevo;
    });
    return () => sub.remove();
  }, [revisar]);
}
