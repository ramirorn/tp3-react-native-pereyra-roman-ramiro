import { Link, Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Colores } from '@/constants/theme';
import { useReportes } from '@/lib/reportes';

function Icono({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { avisos } = useReportes();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: Colores.primario }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          headerTitle: 'Mantenimiento IPF',
          tabBarIcon: ({ focused }) => <Icono emoji="🛠️" focused={focused} />,
          headerRight: () => (
            <Link href="/ajustes-app" asChild>
              <Pressable accessibilityLabel="Ajustes de la app" hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 22 }}>⚙️</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ focused }) => <Icono emoji="📬" focused={focused} />,
          tabBarBadge: avisos.length > 0 ? avisos.length : undefined,
        }}
      />
      <Tabs.Screen
        name="permisos"
        options={{
          title: 'Permisos',
          tabBarIcon: ({ focused }) => <Icono emoji="🔐" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
