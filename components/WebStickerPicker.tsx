import React, { useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView, Alert, Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

const { width: SW } = Dimensions.get('window');
const COLS = 4;
const CELL = Math.floor((SW - 40) / COLS);

// Microsoft Fluent Emoji 3D — MIT licensed illustrated stickers (NOT iPhone emoji)
const FLUENT = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';
function fluentUrl(name: string) {
  const e = encodeURIComponent(name);
  return `${FLUENT}/${e}/3D/${e}_3d.png`;
}

const CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: '하트',
    items: [
      'Red heart','Orange heart','Yellow heart','Green heart','Blue heart',
      'Purple heart','Pink heart','Brown heart','White heart','Sparkling heart',
      'Heart with arrow','Revolving hearts','Two hearts','Growing heart',
      'Beating heart','Love letter',
    ],
  },
  {
    label: '동물',
    items: [
      'Cat face','Dog face','Rabbit face','Hamster','Frog','Bear','Panda',
      'Koala','Fox','Pig face','Hatching chick','Baby chick','Penguin',
      'Seal','Hedgehog','Otter','Sloth','Flamingo',
    ],
  },
  {
    label: '꽃·식물',
    items: [
      'Cherry blossom','Rose','Sunflower','Tulip','Bouquet','Hibiscus',
      'Blossom','Fallen leaf','Maple leaf','Four leaf clover','Seedling',
      'Mushroom','Herb','Shamrock','Potted plant','Lotus',
    ],
  },
  {
    label: '음식·디저트',
    items: [
      'Strawberry','Birthday cake','Cookie','Lollipop','Doughnut','Candy',
      'Chocolate bar','Cupcake','Honey pot','Hot beverage','Ice cream',
      'Shortcake','Pancakes','Waffle','Croissant','Bubble tea',
    ],
  },
  {
    label: '별·달',
    items: [
      'Sparkles','Glowing star','Star','Dizzy','Rainbow','Sun with face',
      'Full moon face','Crescent moon','Snowflake','Fire','Shooting star',
      'Cloud','Sun','Comet','Night with stars',
    ],
  },
  {
    label: '파티·선물',
    items: [
      'Party popper','Confetti ball','Balloon','Wrapped gift','Musical notes',
      'Ribbon','Sparkler','Crystal ball','Fireworks','Carousel horse',
      'Camera','Microphone','Clapper board',
    ],
  },
  {
    label: '악세사리',
    items: [
      'Crown','Ring','Gem stone','Top hat','Graduation cap','Billed cap',
      'Sunglasses','Lipstick','Nail polish','Handbag','High-heeled shoe','Backpack',
    ],
  },
  {
    label: '날씨',
    items: [
      'Rainbow','Cloud with rain','Cloud with snow','Cloud with lightning',
      'Umbrella','Snowman without snow','Sun behind small cloud',
      'Cyclone','Wind face','Snowflake','Water wave','Droplet',
    ],
  },
  {
    label: '과일',
    items: [
      'Strawberry','Cherry','Grapes','Watermelon','Peach','Red apple',
      'Lemon','Pineapple','Mango','Banana','Kiwi fruit','Tangerine',
    ],
  },
  {
    label: '표정',
    items: [
      'Smiling face with hearts','Star-struck','Smiling face with heart-eyes',
      'Winking face','Hugging face','Face with tears of joy',
      'Slightly smiling face','Face blowing a kiss','Partying face',
      'Pleading face','Melting face','Nerd face',
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
  const [failedItems, setFailedItems] = useState<Set<string>>(new Set());
  const [pasting, setPasting] = useState(false);

  async function handleSelect(name: string) {
    if (downloading) return;
    setDownloading(name);
    try {
      const key = name.replace(/\s+/g, '_');
      const localPath = `${FileSystem.cacheDirectory}fluent_${key}.png`;
      const info = await FileSystem.getInfoAsync(localPath);
      let uri: string;
      if (info.exists) {
        uri = localPath;
      } else {
        const dl = await FileSystem.downloadAsync(fluentUrl(name), localPath);
        uri = dl.uri;
      }
      onAdd(uri);
      onClose();
    } catch {
      Alert.alert('다운로드 실패', '인터넷 연결을 확인해 주세요.');
    } finally {
      setDownloading(null);
    }
  }

  async function handlePaste() {
    setPasting(true);
    try {
      const result = await Clipboard.getImageAsync({ format: 'png' });
      if (!result?.data) {
        Alert.alert(
          '클립보드에 이미지 없음',
          '아이폰 스티커 키보드에서 스티커를 꾹 누른 뒤 "복사"를 먼저 해주세요.\n\n또는 사진 앱에서 피사체를 꾹 눌러 "피사체 복사"를 해보세요.',
        );
        return;
      }
      const uri = `${FileSystem.cacheDirectory}clip_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, result.data, { encoding: 'base64' });
      onAdd(uri);
      onClose();
    } catch {
      Alert.alert('오류', '붙여넣기에 실패했어요.');
    } finally {
      setPasting(false);
    }
  }

  const items = CATEGORIES[selectedCat].items.filter(n => !failedItems.has(n));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>스티커</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* iOS sticker paste banner */}
        <TouchableOpacity style={styles.pasteBanner} onPress={handlePaste} disabled={pasting} activeOpacity={0.8}>
          {pasting
            ? <ActivityIndicator size="small" color={Colors.peachDark} />
            : <>
                <Text style={styles.pasteBannerIcon}>[ ]</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pasteBannerTitle}>아이폰 스티커 붙여넣기</Text>
                  <Text style={styles.pasteBannerSub}>스티커 키보드에서 꾹 눌러 복사 후 탭하세요</Text>
                </View>
              </>
          }
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>일러스트 스티커</Text>

        {/* Category tabs */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow} style={styles.tabScroll}
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
          data={items}
          numColumns={COLS}
          keyExtractor={n => n}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item: name }) => (
            <TouchableOpacity
              style={styles.cell}
              onPress={() => handleSelect(name)}
              disabled={downloading !== null}
              activeOpacity={0.7}
            >
              {downloading === name ? (
                <ActivityIndicator size="small" color={Colors.peachDark} />
              ) : (
                <Image
                  source={{ uri: fluentUrl(name) }}
                  style={styles.img}
                  resizeMode="contain"
                  onError={() => setFailedItems(prev => new Set([...prev, name]))}
                />
              )}
            </TouchableOpacity>
          )}
        />

        <Text style={styles.credit}>Microsoft Fluent Emoji · MIT License</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  closeTxt: { fontSize: 20, color: Colors.textSecondary },

  pasteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.peachLight,
    borderRadius: Radius.lg, padding: 14,
    borderWidth: 1.5, borderColor: Colors.peachDark,
  },
  pasteBannerIcon: { fontSize: 18, color: Colors.peachDark, fontWeight: '700', width: 28, textAlign: 'center' },
  pasteBannerTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.peachDark },
  pasteBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xs, letterSpacing: 0.5,
  },

  tabScroll: { flexGrow: 0 },
  tabRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, gap: Spacing.xs },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  tabActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  tabTxt: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.textSecondary },
  tabTxtActive: { color: Colors.peachDark, fontWeight: '700' },

  grid: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 8 },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  img: { width: CELL - 12, height: CELL - 12 },

  credit: {
    fontSize: 10, color: Colors.textMuted, textAlign: 'center', paddingBottom: Spacing.md,
  },
});
