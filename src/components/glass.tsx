import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { colors, radius } from "@/theme";

/**
 * Translucent "glass" surface. Kept as a plain translucent View (rather than a
 * BlurView) because the app background is near-black with soft glows — a frosted
 * fill reads cleaner and is far cheaper to render in long scroll lists.
 */
export function GlassCard({
  children,
  strong,
  style,
}: {
  children?: ReactNode;
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: strong ? colors.glassStrong : colors.glass },
        { borderColor: strong ? colors.border : colors.borderSoft },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: "hidden",
  },
});
