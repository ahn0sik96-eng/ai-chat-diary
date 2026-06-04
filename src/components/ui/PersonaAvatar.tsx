import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme/tokens';

interface Props {
  /** Persona display name — its first character becomes the avatar initial. */
  name: string;
  color: string;
  size?: number;
  /** Show an Instagram-style gradient ring around the avatar. */
  ring?: boolean;
}

/** Clean typographic avatar: a solid colored circle with the persona's initial. */
export function PersonaAvatar({ name, color, size = 56, ring = false }: Props) {
  const initial = name?.trim()?.[0] ?? '·';
  const inner = (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );

  if (!ring) return inner;

  const ringSize = size + 7;
  return (
    <LinearGradient
      colors={gradients.insta}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
    >
      <View
        style={[
          styles.ringInner,
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
        ]}
      >
        {inner}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#FFFFFF', fontWeight: '800' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringInner: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
