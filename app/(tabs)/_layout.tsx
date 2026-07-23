import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';
import BrandMark from '../../components/BrandMark';
import { colors } from '../../lib/theme';

// Calendar keeps a lightweight emoji glyph; Home uses the brand chevron so the
// mark that defines the app also anchors the tab bar.
function TabEmoji({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={{ fontSize: 22, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Each screen renders its own branded header, so hide the nav bar's.
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lift 404',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <BrandMark size={26} tint={color as string} strokeWidth={6} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <TabEmoji icon="📅" color={color} />,
        }}
      />
    </Tabs>
  );
}
