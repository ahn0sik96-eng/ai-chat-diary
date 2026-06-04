import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

interface Props {
  /** Ionicons name for the persona. */
  icon: string;
  size?: number;
  /** Solid dark style instead of the default light neutral. */
  dark?: boolean;
}

/** Clean monochrome avatar: a neutral circle with a single line icon. */
export function PersonaAvatar({ icon, size = 56, dark = false }: Props) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dark ? colors.primary : colors.surfaceAlt,
        },
      ]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={size * 0.46}
        color={dark ? colors.onPrimary : colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
