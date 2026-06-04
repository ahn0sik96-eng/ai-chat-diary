import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Home, Compass, PenLine, Bell, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, gradients, radius } from '@/theme';

const ICONS: Record<string, LucideIcon> = {
  index: Home,
  explore: Compass,
  activity: Bell,
  profile: User,
};

/**
 * 인스타그램식 하단 탭바. 글래스(블러) 배경 + 가운데 그라데이션 "글쓰기" 버튼.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 가운데에 글쓰기 버튼을 끼우기 위해 탭을 좌/우로 나눈다.
  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  function renderTab(route: (typeof routes)[number]) {
    const index = routes.indexOf(route);
    const focused = state.index === index;
    const Icon = ICONS[route.name] ?? Home;
    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        hitSlop={6}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
      >
        <Icon
          size={25}
          color={focused ? colors.text : colors.textFaint}
          strokeWidth={focused ? 2.6 : 2}
          fill={focused ? 'rgba(255,255,255,0.12)' : 'transparent'}
        />
      </Pressable>
    );
  }

  const Bg = Platform.OS === 'web' ? View : BlurView;

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 10 }]}>
      <Bg intensity={40} tint="dark" style={styles.bar}>
        <View style={styles.side}>{left.map(renderTab)}</View>

        <Pressable
          style={styles.createBtn}
          onPress={() => router.push('/(app)/chat')}
          hitSlop={8}
        >
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createInner}
          >
            <PenLine size={24} color={colors.white} strokeWidth={2.6} />
          </LinearGradient>
        </Pressable>

        <View style={styles.side}>{right.map(renderTab)}</View>
      </Bg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    borderRadius: radius.xl,
    marginHorizontal: 4,
    marginBottom: 6,
    paddingHorizontal: 10,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? colors.bgElevated : colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  side: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  createBtn: { marginHorizontal: 8 },
  createInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
