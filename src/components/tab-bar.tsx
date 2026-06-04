import { Pressable, Text, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACCENT_GRADIENT, colors, radius, shadow } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const META: Record<string, { label: string; icon: IconName }> = {
  index: { label: "홈", icon: "home" },
  write: { label: "오늘 쓰기", icon: "create" },
  entries: { label: "일기장", icon: "book" },
  calendar: { label: "달력", icon: "calendar" },
};
const ORDER = ["index", "write", "entries", "calendar"];

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function GlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  // keep our intended order regardless of route registration order
  const routes = ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is { key: string; name: string } => Boolean(r && META[r.name]),
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        {routes.map((route) => {
          const focused =
            state.routes[state.index]?.key === route.key;
          const meta = META[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              {focused ? (
                <LinearGradient
                  colors={ACCENT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.iconWrap, shadow.glow]}
                >
                  <Ionicons name={meta.icon} size={20} color={colors.white} />
                </LinearGradient>
              ) : (
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={(meta.icon + "-outline") as IconName}
                    size={20}
                    color={colors.textFaint}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.label,
                  { color: focused ? colors.text : colors.textGhost },
                ]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 460,
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: "rgba(20,20,28,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
    ...shadow.soft,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 10, fontWeight: "600" },
});
