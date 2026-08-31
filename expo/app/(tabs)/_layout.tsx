import { Tabs } from "expo-router";
import { Home, Compass, BookOpen, Settings, Crown, Sparkles } from "lucide-react-native";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { AuthWrapper } from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const TabIcon = ({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.iconWrap}>
      {focused && (
        <View style={[styles.focusedGlow, { backgroundColor: colors.accentSoft }]} pointerEvents="none" />
      )}
      <Icon color={color} size={22} />
    </View>
  );
};

/**
 * Profile tab icon with a small premium status dot.
 * Gold dot = Premium active, violet dot = Trial active, none = Free.
 * The dot gives users quick visibility of their subscription state from any tab.
 */
const ProfileTabIcon = ({ color, focused }: { color: string; focused: boolean }) => {
  const { isPremium, isTrialActive } = useAuth();
  const { colors } = useTheme();
  const dotColor = isPremium ? colors.gold : isTrialActive ? colors.accent : null;
  return (
    <View style={styles.iconWrap}>
      {focused && <View style={[styles.focusedGlow, { backgroundColor: colors.accentSoft }]} pointerEvents="none" />}
      <Settings color={color} size={22} />
      {dotColor && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: dotColor,
              borderColor: isPremium ? colors.goldLight : colors.accent,
              shadowColor: dotColor,
            },
          ]}
          pointerEvents="none"
        >
          {isPremium ? <Crown color={colors.bg} size={7} /> : <Sparkles color={colors.bg} size={6} />}
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <AuthWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.tabBarInactive,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            elevation: 0,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            height: Platform.OS === 'ios' ? 88 : 72,
            paddingBottom: Platform.OS === 'ios' ? 28 : 16,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600" as const,
            marginTop: 2,
            letterSpacing: 0.5,
          },
          tabBarIconStyle: {
            marginTop: 2,
            height: 32,
            width: 32,
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
        }}
      >
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Journey",
            tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, focused }) => <TabIcon icon={Compass} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: "Learn",
            tabBarIcon: ({ color, focused }) => <TabIcon icon={BookOpen} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
          }}
        />
      </Tabs>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  focusedGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
