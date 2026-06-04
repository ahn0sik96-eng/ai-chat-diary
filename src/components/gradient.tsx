import type { ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ACCENT_GRADIENT, colors, radius, shadow, fonts } from "@/theme";

const START = { x: 0, y: 0 };
const END = { x: 1, y: 1 };

/** A rounded box filled with the brand accent gradient. */
export function GradientBox({
  children,
  style,
  c = ACCENT_GRADIENT,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  c?: readonly [string, string, ...string[]];
}) {
  return (
    <LinearGradient colors={c} start={START} end={END} style={style}>
      {children}
    </LinearGradient>
  );
}

/** Primary call-to-action button with gradient fill and soft glow. */
export function GradientButton({
  label,
  onPress,
  icon,
  disabled,
  glow = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        glow && !disabled ? shadow.glow : null,
        { opacity: disabled ? 0.4 : pressed ? 0.85 : 1, borderRadius: radius.lg },
        style,
      ]}
    >
      <LinearGradient
        colors={ACCENT_GRADIENT}
        start={START}
        end={END}
        style={styles.btn}
      >
        {icon}
        <Text style={styles.btnLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Lumi logo mark — a small gradient tile with a spark glyph. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View style={[shadow.glow, { borderRadius: size * 0.32 }]}>
      <LinearGradient
        colors={ACCENT_GRADIENT}
        start={START}
        end={END}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.5, color: colors.white }}>✦</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  btnLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.rounded,
  },
});
