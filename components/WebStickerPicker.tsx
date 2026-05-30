import React, { useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView, Alert, Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

const { width: SW } = Dimensions.get('window');

const TWEMOJI_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72';
const NOTO_CDN = 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72';

const COLS = 5;
const CELL = Math.floor((SW - 32) / COLS);

type StickerStyle = 'twemoji' | 'noto';

function stickerUrl(code: string, style: StickerStyle): string {
  const c = code.toLowerCase();
  if (style === 'noto') {
    return `${NOTO_CDN}/emoji_u${c}.png`;
  }
  return `${TWEMOJI_CDN}/${c}.png`;
}

const CATEGORIES: { label: string; codes: string[] }[] = [
  {
    label: '💕 하트',
    codes: ['2764','1f9e1','1f49b','1f49a','1f499','1f49c','1f90d','1f5a4','1f493','1f494','1f495','1f496','1f497','1f498','1f49d','1f49e','1f48c','2665','1f970','1f60d'],
  },
  {
    label: '🌸 꽃·자연',
    codes: ['1f338','1f33a','1f33b','1f339','1f337','1f490','1f33c','1f33f','1f342','1f343','1f331','1f344','1f340','1f332','1f333','1f334','1f335','1f4ab','2618','1f30e'],
  },
  {
    label: '🐱 동물',
    codes: ['1f431','1f436','1f430','1f43b','1f98a','1f43c','1f428','1f439','1f43f','1f987','1f98b','1f41d','1f43e','1f425','1f40d','1f422','1f40c','1f41e','1f420','1f421'],
  },
  {
    label: '🍰 음식·음료',
    codes: ['1f370','1f9c1','1f353','1f369','2615','1f9cb','1f36a','1f36b','1f36d','1f351','1f352','1f34b','1f382','1f9c0','1f36e','1f967','1f950','1f9c3','1f95e','1f9c7'],
  },
  {
    label: '⭐ 별·빛',
    codes: ['2728','1f31f','2b50','1f4ab','1f319','1f308','1f31e','1f31d','26a1','1f4a5','1f7e1','1f7e0','1f534','1f7e3','1f535','1f7e2','1f7e4','1f7e5','1f7e6','1f7e7'],
  },
  {
    label: '🎉 파티·데코',
    codes: ['1f38a','1f389','1f381','1f380','1fa84','1f3b5','1f3b6','1f4dd','1f4f8','1f302','1f9e8','1f48c','1f4da','1f3a8','1f58a','270f','1f4cc','1f4cd','1f4ce','1f4cf'],
  },
  {
    label: '👑 리본·왕관',
    codes: ['1f451','1f48d','1f484','1f380','1f9e2','1f393','1f3a9','1f452','1fa77','1fa76','1fa75','1f461','1f462','1f45f','1f460','1f45e','1f45c','1f45b','1f458','1f457'],
  },
  {
    label: '🌙 무드·날씨',
    codes: ['1f319','2600','26c5','1f327','2744','1f308','1f324','1f325','1f326','1f328','2614','2603','26c4','1f321','2615','1f30a','1f332','26fa','1f303','1f304'],
  },
  {
    label: '🎨 예술·취미',
    codes: ['1f3a8','1f58c','270f','1f4f7','1f4f9','1f3b8','1f3b9','1f3ba','1f3bb','1f941','1f4d6','1f4f0','1f4bb','1f4f1','1f50d','1f9ea','1f52d','1f3af','1f3ae','1f579'],
  },
  {
    label: '✈️ 여행',
    codes: ['2708','1f697','1f6b2','1f9f3','1f3d6','1f3d4','1f3e0','1f3aa','1f3a1','1f3a2','1f387','1f386','26f2','1f30a','1f5fe','1f303','1f304','1f305','1f306','1f307'],
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
  const [style, setStyle] = useState<StickerStyle>('twemoji');

  async function handleSelect(code: string) {
    if (downloading) return;
    setDownloading(code);
    try {
      const cacheKey = `${style}_${code}`;
      const localPath = `${FileSystem.cacheDirectory}sticker_${cacheKey}.png`;
      const info = await FileSystem.getInfoAsync(localPath);
      let finalUri: string;
      if (info.exists) {
        finalUri = localPath;
      } else {
        const dl = await FileSystem.downloadAsync(stickerUrl(code, style), localPath);
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

  const creditText = style === 'twemoji'
    ? 'Twemoji · CC BY 4.0'
    : 'Noto Emoji · Apache 2.0 · Google';

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

        {/* Style selector */}
        <View style={styles.styleRow}>
          <Text style={styles.styleLabel}>스타일:</Text>
          <TouchableOpacity
            style={[styles.styleChip, style === 'twemoji' && styles.styleChipActive]}
            onPress={() => setStyle('twemoji')}
          >
            <Text style={[styles.styleChipTxt, style === 'twemoji' && styles.styleChipTxtActive]}>
              🟠 Twemoji
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.styleChip, style === 'noto' && styles.styleChipActiveNoto]}
            onPress={() => setStyle('noto')}
          >
            <Text style={[styles.styleChipTxt, style === 'noto' && styles.styleChipTxtActiveNoto]}>
              🔵 Noto
            </Text>
          </TouchableOpacity>
        </View>

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
          key={`${style}_${selectedCat}`}
          data={codes}
          numColumns={COLS}
          keyExtractor={c => `${style}_${c}`}
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
                  source={{ uri: stickerUrl(code, style) }}
                  style={styles.stickerImg}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          )}
        />

        {/* Credit */}
        <Text style={styles.credit}>{creditText}</Text>
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
  styleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  styleLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginRight: 4 },
  styleChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  styleChipActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  styleChipActiveNoto: { borderColor: Colors.lavenderDark, backgroundColor: Colors.lavenderLight },
  styleChipTxt: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.textSecondary },
  styleChipTxtActive: { color: Colors.peachDark, fontWeight: '600' },
  styleChipTxtActiveNoto: { color: Colors.lavenderDark, fontWeight: '600' },
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
  grid: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 4 },
  cell: {
    width: CELL, height: CELL,
    alignItems: 'center', justifyContent: 'center',
  },
  stickerImg: { width: CELL - 8, height: CELL - 8 },
  credit: {
    fontSize: 10, color: Colors.textMuted, textAlign: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
});
