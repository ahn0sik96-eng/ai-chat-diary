import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Modal, TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

export interface DetectedSchedule {
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm
  isReminder?: boolean;
}

interface SchedulePopupProps {
  visible: boolean;
  schedules: DetectedSchedule[];
  onConfirm: (schedules: DetectedSchedule[]) => void;
  onDismiss: () => void;
}

export default function SchedulePopup({
  visible,
  schedules,
  onConfirm,
  onDismiss,
}: SchedulePopupProps) {
  const slideAnim = useRef(new Animated.Value(200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 200, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible && schedules.length === 0) return null;

  function formatDate(dateStr: string, time?: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const dateLabel = d.toLocaleDateString('ko-KR', {
      month: 'long', day: 'numeric', weekday: 'short',
    });
    return time ? `${dateLabel} ${time}` : dateLabel;
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handle} />

        <Text style={styles.title}>
          {schedules.some((s) => s.isReminder) && schedules.some((s) => !s.isReminder)
            ? '일정과 할 일을 추가할까요?'
            : schedules.every((s) => s.isReminder)
            ? '할 일을 저장할까요?'
            : '일정을 캘린더에 추가할까요?'}
        </Text>

        <View style={styles.list}>
          {schedules.map((s, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.iconBg, { backgroundColor: s.isReminder ? '#FEF3E8' : '#EEF2FE' }]}>
                <Text style={styles.icon}>{s.isReminder ? '✓' : '📅'}</Text>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{s.title}</Text>
                <Text style={styles.itemDate}>{formatDate(s.date, s.time)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>건너뛰기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: Colors.peach }]}
            onPress={() => onConfirm(schedules)}
          >
            <Text style={styles.confirmText}>추가하기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 16,
    paddingTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  list: { gap: Spacing.sm, marginBottom: Spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBg: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 16 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  itemDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  dismissBtn: {
    flex: 1, paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full, alignItems: 'center',
    backgroundColor: Colors.grayLight, borderWidth: 1, borderColor: Colors.border,
  },
  dismissText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  confirmBtn: {
    flex: 2, paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full, alignItems: 'center',
  },
  confirmText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
});
