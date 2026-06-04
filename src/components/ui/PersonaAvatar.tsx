import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  emoji: string;
  color: string;
  size?: number;
}

export function PersonaAvatar({ emoji, color, size = 56 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '26' },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
