import React, { useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView, Alert, Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

const { width: SW } = Dimensions.get('window');
// Twemoji CDN (cdnjs) — verified working, CC BY 4.0
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72';
const COLS = 5;
const CELL = Math.floor((SW - 32) / COLS);

function stickerUrl(code: string) {
  return `${CDN}/${code.toLowerCase()}.png`;
}

// copyright: OpenMoji CC BY-SA 4.0  https://openmoji.org
const CATEGORIES: { label: string; codes: string[] }[] = [
  {
    label: '💕 감성',
    codes: [
      '2728', '1F31F', '2B50', '1F4AB', '1F319',
      '1F308', '1F495', '1F497', '1F496', '1F49C',
      '1F499', '1F49A', '1F90D', '1F5A4', '1F9E1',
    ],
  },
  {
    label: '🌸 꽃',
    codes: [
      '1F338', '1F33A', '1F33B', '1F339', '1F337',
      '1F490', '1F33C', '1F33F', '1F342', '1F343',
      '1F331', '1F344', '1F340', '1F33E', '1F332',
    ],
  },
  {
    label: '🐱 동물',
    codes: [
      '1F431', '1F436', '1F430', '1F43B', '1F98A',
      '1F43C', '1F428', '1F439', '1F438', '1F986',
      '1F427', '1F98B', '1F41D', '1F43F', '1F99C',
    ],
  },
  {
    label: '🍰 음식',
    codes: [
      '1F370', '1F9C1', '1F353', '1F369', '2615',
      '1F9CB', '1F36A', '1F36B', '1F36D', '1F351',
      '1F352', '1F34B', '1F382', '1F9C0', '1F36E',
    ],
  },
  {
    label: '🎉 데코',
    codes: [
      '1F38A', '1F389', '1F381', '1F380', '1FA84',
      '1F3B5', '1F3B6', '1F4DD', '1F4F8', '1F302',
      '1F9E8', '1F4A5', '1F48C', '2764', '1F4DA',
    ],
  },
  {
    label: '🌙 무드',
    codes: [
      '1F9F8', '270F', '1F58A', '1F56F', '1F5A4',
      '1F4C3', '1F4DA', '1F3A8', '1F9F5', '1FA86',
      '1F9F6', '1F9F7', '1F48D', '1F451', '1FA7A',
    ],
  },
];

interface Props {
  visible: boolean;
  onAdd: (localUri: string) => void;
  onClose: () => void;
}

export default function WebStickerPicker({ visible, onAdd, onClose }: Props) {
  const [selectedCat, setSelectedCat] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleSelect(code: string) {
    if (downloading) return;
    setDownloading(code);
    try {
      const localPath = `${FileSystem.cacheDirectory}openmoji_${code}.png`;
      const info = await FileSystem.getInfoAsync(localPath);
      let finalUri: string;
      if (info.exists) {
        finalUri = localPath;
      } else {
        const dl = await FileSystem.downloadAsync(stickerUrl(code), localPath);
        finalUri = dl.uri;
      }
      onAdd(finalUri);
      onClose();
    } catch {
      Alert.alert('다운로드 실패', '인터넷 연결을 확인해 주세요.');
    } finally {
      setDownloading(null);
    }
  }

  const codes = CATEGORIES[selectedCat].codes;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>인터넷 스티커</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.credit}>Twemoji · CC BY 4.0 · twemoji.twitter.com</Text>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          style={styles.tabScroll}
        >
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tab, selectedCat === i && styles.tabActive]}
              onPress={() => setSelectedCat(i)}
            >
              <Text style={[styles.tabTxt, selectedCat === i && styles.tabTxtActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sticker grid */}
        <FlatList
          key={selectedCat}
          data={codes}
          numColumns={COLS}
          keyExtractor={c => c}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item: code }) => (
            <TouchableOpacity
              style={styles.cell}
              onPress={() => handleSelect(code)}
              disabled={downloading !== null}
              activeOpacity={0.7}
            >
              {downloading === code ? (
                <ActivityIndicator size="small" color={Colors.peachDark} />
              ) : (
                <Image
                  source={{ uri: stickerUrl(code) }}
                  style={styles.stickerImg}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 4,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  closeTxt: { fontSize: 20, color: Colors.textSecondary },
  credit: {
    fontSize: 10, color: Colors.textMuted,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs,
  },
  tabScroll: { flexGrow: 0 },
  tabRow: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, gap: Spacing.xs,
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  tabActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  tabTxt: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.textSecondary },
  tabTxtActive: { color: Colors.peachDark, fontWeight: '600' },
  grid: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  row: { justifyContent: 'space-between', marginBottom: 4 },
  cell: {
    width: CELL, height: CELL,
    alignItems: 'center', justifyContent: 'center',
  },
  stickerImg: { width: CELL - 8, height: CELL - 8 },
});
