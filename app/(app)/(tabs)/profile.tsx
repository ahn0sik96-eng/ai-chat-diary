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
import { Settings, NotebookPen } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { getMyEntries, getFollowCounts } from '@/lib/queries';
import type { Entry } from '@/lib/types';
import {
  GradientBackground,
  Avatar,
  EntryGridCell,
  EmptyState,
  PrimaryButton,
} from '@/components';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function ProfileScreen() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [e, c] = await Promise.all([
        getMyEntries(session.user.id),
        getFollowCounts(session.user.id),
      ]);
      setEntries(e);
      setCounts(c);
    } catch (err) {
      console.warn('profile load failed', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const name = profile?.display_name || profile?.username || '나';

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.identity}>
        <Avatar uri={profile?.avatar_url} name={name} size={76} ring />
        <View style={styles.stats}>
          <Stat label="일기" value={entries.length} />
          <Stat label="팔로워" value={counts.followers} />
          <Stat label="팔로잉" value={counts.following} />
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.handle}>@{profile?.username ?? '...'}</Text>
      {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      <PrimaryButton
        label="오늘 일기 쓰기"
        variant="secondary"
        style={{ marginTop: spacing.md }}
        onPress={() => router.push('/(app)/chat')}
      />
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>프로필</Text>
          <Pressable onPress={() => router.push('/(app)/settings')} hitSlop={10}>
            <Settings size={24} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            numColumns={2}
            columnWrapperStyle={styles.col}
            ListHeaderComponent={header}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <EntryGridCell
                item={item}
                showVisibility
                onPress={() =>
                  router.push(
                    item.status === 'done'
                      ? `/(app)/entry/${item.id}`
                      : '/(app)/chat'
                  )
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={NotebookPen}
                title="첫 일기를 시작해 보세요"
                subtitle="AI 친구와 대화하면 오늘 하루가 일기로 남아요."
              />
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: fontSize.xl },
  headerBlock: { marginBottom: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  stats: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { color: colors.text, fontFamily: fonts.heavy, fontSize: fontSize.lg },
  statLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.xs },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.lg, marginTop: spacing.md },
  handle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm },
  bio: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md, marginTop: 6, lineHeight: 21 },
  list: { padding: spacing.lg, paddingBottom: 110, flexGrow: 1 },
  col: { gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
