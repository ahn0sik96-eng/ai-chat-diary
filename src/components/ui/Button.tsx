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
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
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
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.label,
              isPrimary ? styles.labelPrimary : styles.labelSecondary,
              isGhost && { color: colors.textMuted },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '700' },
  labelPrimary: { color: colors.onPrimary },
  labelSecondary: { color: colors.primary },
});
