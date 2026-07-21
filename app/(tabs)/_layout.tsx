import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import { colors } from '../../lib/theme';

// Simple emoji tab icons keep the app dependency-free (no icon font needed).
function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={{ fontSize: 22, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lift 404',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏋️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <TabIcon icon="📅" color={color} />,
        }}
      />
    </Tabs>
  );
}
