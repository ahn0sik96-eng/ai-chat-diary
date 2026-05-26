import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Pressable,
} from 'react-native';
import { STICKER_PACKS } from '../constants/decorations';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

interface StickerPickerProps {
  visible: boolean;
  unlockedPackIds: string[];
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function StickerPicker({
  visible, unlockedPackIds, onSelect, onClose,
}: StickerPickerProps) {
  const availablePacks = unlockedPackIds
    .filter((id) => STICKER_PACKS[id])
    .map((id) => ({ id, ...STICKER_PACKS[id] }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>스티커 추가</Text>

        {availablePacks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              스티커 팩이 없어요.{'\n'}스토어에서 구매해 보세요 🛍️
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {availablePacks.map((pack) => (
              <View key={pack.id} style={styles.pack}>
                <Text style={styles.packLabel}>{pack.label}</Text>
                <View style={styles.grid}>
                  {pack.stickers.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.stickerBtn}
                      onPress={() => { onSelect(emoji); onClose(); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stickerEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  pack: { marginBottom: Spacing.lg },
  packLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stickerBtn: {
    width: 48, height: 48, borderRadius: Radius.sm,
    backgroundColor: Colors.grayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stickerEmoji: { fontSize: 26 },
  empty: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
