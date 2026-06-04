import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/theme";

/**
 * Full-bleed app background: near-black base with soft colored "glow" orbs
 * to echo the ambient gradients of the design. Place at the root behind
 * every screen's scroll content.
 */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glows}>
        <View style={[styles.orb, styles.orbViolet]} />
        <View style={[styles.orb, styles.orbCyan]} />
        <View style={[styles.orb, styles.orbFuchsia]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glows: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  orb: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 360,
    opacity: 0.18,
  },
  orbViolet: { top: -120, left: -80, backgroundColor: "#8b5cf6" },
  orbCyan: { top: -60, right: -120, backgroundColor: "#22d3ee", opacity: 0.12 },
  orbFuchsia: { bottom: -140, alignSelf: "center", backgroundColor: "#d946ef", opacity: 0.12 },
});
