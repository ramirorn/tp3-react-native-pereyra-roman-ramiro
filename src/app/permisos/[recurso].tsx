import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { Boton } from '@/components/boton';
import { Pantalla } from '@/components/pantalla';
import { PantallaPrevia } from '@/components/pantalla-previa';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { usePermiso } from '@/hooks/usePermiso';
import { INFO_RECURSO, RECURSOS, type Recurso } from '@/lib/permisos';

function esRecurso(valor: unknown): valor is Recurso {
  return typeof valor === 'string' && (RECURSOS as string[]).includes(valor);
}

export default function PermisoPrevio() {
  const { recurso } = useLocalSearchParams<{ recurso: string }>();

  if (!esRecurso(recurso)) {
    return (
      <Pantalla>
        <Tarjeta>
          <ThemedText type="smallBold">Permiso desconocido</ThemedText>
          <ThemedText type="small">“{recurso}” no es un permiso que use esta app.</ThemedText>
        </Tarjeta>
      </Pantalla>
    );
  }

  return <Previa recurso={recurso} />;
}

function Previa({ recurso }: { recurso: Recurso }) {
  const router = useRouter();
  const { siguiente } = useLocalSearchParams<{ siguiente?: string }>();
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);

  // Cierra la pantalla previa y, si corresponde, sigue a la función que la persona tocó.
  // La función tiene su propia alternativa para cuando el permiso se denegó.
  function seguir() {
    router.back();
    if (siguiente) router.push(siguiente as Href);
  }

  async function continuar() {
    await pedir();
    seguir();
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: INFO_RECURSO[recurso].nombre }} />

      {estado === 'cargando' && <ActivityIndicator size="large" />}

      {estado === 'concedido' && (
        <>
          <ThemedText type="subtitle">✅ Listo</ThemedText>
          <ThemedText>El permiso de {INFO_RECURSO[recurso].nombre.toLowerCase()} ya está concedido.</ThemedText>
          <Boton titulo="Continuar" onPress={seguir} />
        </>
      )}

      {(estado === 'preguntable' || estado === 'bloqueado') && (
        <PantallaPrevia
          recurso={recurso}
          bloqueado={estado === 'bloqueado'}
          onContinuar={continuar}
          onAbrirAjustes={abrirAjustes}
        />
      )}
    </Pantalla>
  );
}
