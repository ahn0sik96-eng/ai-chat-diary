import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react-native';

import { getActivity, type ActivityItem } from '@/lib/queries';
import { timeAgo } from '@/lib/date';
import { GradientBackground, Avatar, EmptyState } from '@/components';
import { colors, fonts, fontSize, spacing } from '@/theme';

function describe(item: ActivityItem): string {
  switch (item.type) {
    case 'reaction':
      return `님이 회원님의 일기에 공감했어요`;
    case 'comment':
      return `님이 댓글을 남겼어요: ${item.content ?? ''}`;
    case 'follow':
      return `님이 회원님을 팔로우하기 시작했어요`;
  }
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  if (type === 'reaction') return <Heart size={16} color={colors.pink} fill={colors.pink} />;
  if (type === 'comment') return <MessageCircle size={16} color={colors.blue} />;
  return <UserPlus size={16} color={colors.success} />;
}

export default function ActivityScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await getActivity());
    } catch (e) {
      console.warn('activity load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Text style={styles.title}>알림</Text>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => `${i.type}-${i.id}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const name = item.actor_display_name || item.actor_username;
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    if (item.type === 'follow') router.push(`/(app)/user/${item.actor_id}`);
                    else if (item.entry_id) router.push(`/(app)/entry/${item.entry_id}`);
                  }}
                >
                  <Avatar uri={item.actor_avatar_url} name={name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>
                      <Text style={styles.name}>{name}</Text>
                      {describe(item)}
                    </Text>
                    <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <ActivityIcon type={item.type} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon={Bell}
                title="아직 새 소식이 없어요"
                subtitle="공감, 댓글, 새 팔로워 소식이 여기에 모여요."
              />
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.heavy,
    fontSize: fontSize.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  list: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { color: colors.text, fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 20 },
  name: { fontFamily: fonts.bold },
  time: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: fontSize.xs, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
