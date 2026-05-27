import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

export type DrawingTool = 'pencil' | 'highlighter' | 'tape';

const TOOLS: { id: DrawingTool; icon: string; label: string }[] = [
  { id: 'pencil',      icon: '✏️', label: '색연필' },
  { id: 'highlighter', icon: '🖊️', label: '형광펜' },
  { id: 'tape',        icon: '📏', label: '마스킹' },
];

const COLORS = [
  '#E53E3E', '#DD6B20', '#D69E2E', '#38A169',
  '#3182CE', '#805AD5', '#D53F8C', '#1A202C',
];

interface Props {
  activeTool: DrawingTool;
  activeColor: string;
  onToolChange: (t: DrawingTool) => void;
  onColorChange: (c: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function FloatingPalette({
  activeTool, activeColor, onToolChange, onColorChange, onUndo, canUndo,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const pos = React.useRef(new RNAnimated.ValueXY({ x: 12, y: 200 })).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderGrant: () => {
      pos.setOffset({ x: (pos.x as any)._value, y: (pos.y as any)._value });
      pos.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: RNAnimated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pos.flattenOffset(),
  });

  return (
    <RNAnimated.View
      style={[styles.palette, { transform: pos.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      {/* Drag handle / collapse toggle */}
      <TouchableOpacity style={styles.handle} onPress={() => setExpanded(v => !v)}>
        <Text style={styles.handleDot}>⠿</Text>
      </TouchableOpacity>

      {expanded && (
        <>
          {/* Tool buttons */}
          <View style={styles.toolRow}>
            {TOOLS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.toolBtn, activeTool === t.id && styles.toolBtnActive]}
                onPress={() => onToolChange(t.id)}
              >
                <Text style={styles.toolIcon}>{t.icon}</Text>
                <Text style={styles.toolLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color swatches */}
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, activeColor === c && styles.colorDotActive]}
                onPress={() => onColorChange(c)}
              />
            ))}
          </View>

          {/* Undo */}
          <TouchableOpacity style={[styles.undoBtn, !canUndo && styles.undoBtnDisabled]} onPress={onUndo} disabled={!canUndo}>
            <Text style={styles.undoText}>↩ 되돌리기</Text>
          </TouchableOpacity>
        </>
      )}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  palette: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
    minWidth: 120,
  },
  handle: { alignItems: 'center', paddingVertical: 2 },
  handleDot: { fontSize: 16, color: Colors.textMuted },
  toolRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  toolBtn: {
    alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: Radius.sm, backgroundColor: Colors.grayLight,
  },
  toolBtnActive: { backgroundColor: Colors.peachLight, borderWidth: 1.5, borderColor: Colors.peachDark },
  toolIcon: { fontSize: 18 },
  toolLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 1 },
  colorRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  colorDotActive: { borderWidth: 2.5, borderColor: Colors.text },
  undoBtn: {
    marginTop: 8, paddingVertical: 6, alignItems: 'center',
    backgroundColor: Colors.grayLight, borderRadius: Radius.sm,
  },
  undoBtnDisabled: { opacity: 0.4 },
  undoText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text },
});
