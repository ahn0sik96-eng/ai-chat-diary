import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Image, Pressable, Text, StyleSheet,
  Dimensions, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { removeBackground } from '../utils/imageProcessing';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  imageUri: string;
  onAdd: (uri: string) => void;
  onClose: () => void;
}

type Phase = 'select' | 'processing' | 'preview';

export default function SubjectExtractorModal({ visible, imageUri, onAdd, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [containerLayout, setContainerLayout] = useState({ w: SW, h: SH * 0.65 });
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (visible && imageUri) {
      setPhase('select');
      setPreviewUri(null);
      setTouchPos(null);
      busy.current = false;
      Image.getSize(imageUri, (w, h) => setNatural({ w, h }), () => {});
    }
  }, [visible, imageUri]);

  function computeImageLayout() {
    const { w: cW, h: cH } = containerLayout;
    const aspect = natural.w / natural.h;
    let sW = cW;
    let sH = cW / aspect;
    if (sH > cH) { sH = cH; sW = cH * aspect; }
    return { sW, sH, offX: (cW - sW) / 2, offY: (cH - sH) / 2 };
  }

  async function handleLongPress(px: number, py: number) {
    if (busy.current) return;
    busy.current = true;
    setTouchPos({ x: px, y: py });
    setPhase('processing');

    const { sW, sH, offX, offY } = computeImageLayout();
    const imgX = (px - offX) / (sW / natural.w);
    const imgY = (py - offY) / (sH / natural.h);

    // Crop 75% of the shorter side, centred on the tap
    const side = Math.min(natural.w, natural.h) * 0.75;
    const ox = Math.round(Math.max(0, Math.min(imgX - side / 2, natural.w - side)));
    const oy = Math.round(Math.max(0, Math.min(imgY - side / 2, natural.h - side)));
    const cW = Math.round(Math.min(side, natural.w - ox));
    const cH = Math.round(Math.min(side, natural.h - oy));

    try {
      const cropped = await (ImageManipulator as any).manipulateAsync(
        imageUri,
        [{ crop: { originX: ox, originY: oy, width: cW, height: cH } }],
        { compress: 0.9, format: (ImageManipulator as any).SaveFormat?.JPEG ?? 'jpeg' },
      );
      const removed = await removeBackground(cropped.uri);
      setPreviewUri(removed ?? cropped.uri);
    } catch {
      setPreviewUri(null);
    }

    setPhase('preview');
    busy.current = false;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>피사체 추출</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image canvas */}
        <View
          style={styles.canvas}
          onLayout={e => setContainerLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {phase !== 'preview' ? (
            <Pressable
              style={StyleSheet.absoluteFill}
              delayLongPress={500}
              onPressIn={e => {
                if (phase === 'select') setTouchPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
              }}
              onPressOut={() => { if (phase === 'select') setTouchPos(null); }}
              onLongPress={e => handleLongPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
              disabled={phase === 'processing'}
            >
              <Image source={{ uri: imageUri }} style={styles.fullImg} resizeMode="contain" />

              {/* Ring indicator */}
              {touchPos && phase === 'select' && (
                <View style={[styles.ring, { left: touchPos.x - 40, top: touchPos.y - 40 }]} />
              )}

              {/* Processing overlay */}
              {phase === 'processing' && (
                <View style={styles.overlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.overlayTxt}>피사체 추출 중…</Text>
                </View>
              )}
            </Pressable>
          ) : (
            // Preview result
            <View style={styles.previewWrap}>
              <View style={styles.checker}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={styles.previewImg} resizeMode="contain" />
                ) : (
                  <Text style={styles.errTxt}>추출 실패</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Bottom instructions / actions */}
        <View style={styles.bottom}>
          {phase === 'select' && (
            <>
              <Text style={styles.title}>피사체를 꾹 눌러 선택하세요</Text>
              <Text style={styles.sub}>원하는 피사체 위에 0.5초간 누르면{'\n'}자동으로 잘라냅니다</Text>
            </>
          )}
          {phase === 'processing' && (
            <Text style={styles.title}>잠깐 기다려 주세요…</Text>
          )}
          {phase === 'preview' && (
            <>
              <Text style={styles.title}>
                {previewUri ? '피사체가 추출됐어요!' : '추출에 실패했어요'}
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => { setPhase('select'); setPreviewUri(null); setTouchPos(null); busy.current = false; }}
                >
                  <Text style={styles.retryTxt}>다시 선택</Text>
                </TouchableOpacity>
                {previewUri && (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => { onAdd(previewUri); onClose(); }}
                  >
                    <Text style={styles.addTxt}>다이어리에 추가</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: 52, paddingBottom: Spacing.sm,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
  canvas: { flex: 1, backgroundColor: '#000' },
  fullImg: { width: '100%', height: '100%' },
  ring: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  overlayTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '500' },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' },
  checker: {
    width: 280, height: 280, borderRadius: 20,
    backgroundColor: '#ddd',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  previewImg: { width: 260, height: 260 },
  errTxt: { fontSize: FontSize.md, color: Colors.textSecondary },
  bottom: {
    backgroundColor: '#111',
    paddingHorizontal: Spacing.lg, paddingBottom: 44, paddingTop: Spacing.md,
    minHeight: 140, alignItems: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: FontSize.sm, color: '#999', textAlign: 'center', lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, width: '100%' },
  retryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: '#333', alignItems: 'center',
  },
  retryTxt: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },
  addBtn: {
    flex: 2, paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: Colors.peachDark, alignItems: 'center',
  },
  addTxt: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },
});
