import { useEffect, useState } from "react";
import { Animated, Text, View, StyleSheet, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ACCENT_GRADIENT, colors, radius, fonts } from "@/theme";
import type { ChatMessage } from "@/lib/types";

export function Avatar({ size = 32 }: { size?: number }) {
  return (
    <LinearGradient
      colors={ACCENT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.5, color: colors.white }}>✦</Text>
    </LinearGradient>
  );
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      style={[
        styles.row,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      {!isUser && <Avatar />}
      {isUser ? (
        <LinearGradient
          colors={ACCENT_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.userBubble]}
        >
          <Text style={styles.userText}>{message.content}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.aiBubble]}>
          <Text style={styles.aiText}>{message.content}</Text>
        </View>
      )}
    </View>
  );
}

export function TypingIndicator() {
  const [dots] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: 1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={[styles.row, { justifyContent: "flex-start" }]}>
      <Avatar />
      <View style={[styles.bubble, styles.aiBubble, styles.typing]}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  bubble: { maxWidth: "78%", borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { borderBottomRightRadius: radius.sm },
  aiBubble: {
    borderBottomLeftRadius: radius.sm,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
  },
  userText: { color: colors.white, fontSize: 15, lineHeight: 22, fontFamily: fonts.sans },
  aiText: { color: "rgba(255,255,255,0.92)", fontSize: 15, lineHeight: 22, fontFamily: fonts.sans },
  typing: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.8)" },
});
