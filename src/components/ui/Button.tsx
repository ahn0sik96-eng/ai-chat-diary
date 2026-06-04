import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'gradient' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: Props) {
  const isGradient = variant === 'gradient';
  const dark = variant === 'primary';
  const isGhost = variant === 'ghost';

  const inner = loading ? (
    <ActivityIndicator color={dark || isGradient ? colors.onPrimary : colors.text} />
  ) : (
    <View style={styles.row}>
      {icon}
      <Text
        style={[
          styles.label,
          (dark || isGradient) && { color: colors.onPrimary },
          variant === 'secondary' && { color: colors.text },
          isGhost && { color: colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (isGradient) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.base,
          (disabled || loading) && styles.disabled,
          pressed && { opacity: 0.9 },
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.pad,
        dark && styles.primary,
        variant === 'secondary' && styles.secondary,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceAlt },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
