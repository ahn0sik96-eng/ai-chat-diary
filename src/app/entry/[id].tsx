import { useState } from "react";
import { Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Backdrop } from "@/components/screen";
import { ChatBubble } from "@/components/chat-bubble";
import { MoodBadge } from "@/components/mood-badge";
import { useDiary } from "@/lib/store";
import { moodOf } from "@/lib/moods";
import { formatLongDate } from "@/lib/utils";
import { colors, fonts, radius } from "@/theme";

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getEntry, deleteEntry } = useDiary();
  const [showChat, setShowChat] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const entry = getEntry(id);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/entries");
  }

  if (!entry) {
    return (
      <Backdrop>
        <View style={[styles.center, { paddingTop: insets.top + 80 }]}>
          <Text style={styles.missing}>일기를 찾을 수 없어요.</Text>
          <Pressable onPress={() => router.replace("/entries")} style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color={colors.accentSoft} />
            <Text style={styles.backLinkText}>일기장으로</Text>
          </Pressable>
        </View>
      </Backdrop>
    );
  }

  const m = moodOf(entry.mood);

  return (
    <Backdrop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Pressable onPress={goBack} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroHead}>
            <LinearGradient
              colors={m.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.moodBig}
            >
              <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.heroDate}>{formatLongDate(entry.date)}</Text>
              <View style={{ marginTop: 4, alignSelf: "flex-start" }}>
                <MoodBadge mood={entry.mood} size="sm" />
              </View>
            </View>
          </View>

          <Text style={styles.heroTitle}>{entry.title}</Text>
          <Text style={styles.body}>{entry.summary}</Text>

          {entry.tags.length > 0 && (
            <View style={styles.tags}>
              {entry.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Conversation toggle */}
        <Pressable onPress={() => setShowChat((v) => !v)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            Lumi와 나눈 대화 ({entry.messages.length})
          </Text>
          <Ionicons
            name={showChat ? "chevron-down" : "chevron-forward"}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {showChat && (
          <View style={styles.convo}>
            {entry.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </View>
        )}

        {/* Delete */}
        <View style={styles.danger}>
          {confirming ? (
            <View style={styles.confirm}>
              <Text style={styles.confirmText}>정말 삭제할까요?</Text>
              <Pressable
                onPress={() => {
                  deleteEntry(entry.id);
                  router.replace("/entries");
                }}
                style={styles.delBtn}
              >
                <Text style={styles.delText}>삭제</Text>
              </Pressable>
              <Pressable onPress={() => setConfirming(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setConfirming(true)} style={styles.delLink}>
              <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
              <Text style={styles.delLinkText}>이 일기 삭제</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: 14 },
  missing: { color: colors.textMuted, fontSize: 14 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  backLinkText: { color: colors.accentSoft, fontSize: 14, fontWeight: "700" },

  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  backText: { color: colors.textMuted, fontSize: 14 },

  hero: {
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    padding: 22,
  },
  heroHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  moodBig: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heroDate: { color: colors.textMuted, fontSize: 14 },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "700",
    fontFamily: fonts.serif,
    marginTop: 18,
  },
  body: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    lineHeight: 28,
    fontStyle: "italic",
    fontFamily: fonts.serif,
    marginTop: 14,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 },
  tag: {
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { color: colors.textMuted, fontSize: 12 },

  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 16,
  },
  toggleText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },
  convo: {
    gap: 16,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
    borderRadius: radius["2xl"],
    padding: 16,
    marginTop: 12,
  },

  danger: { alignItems: "center", marginTop: 32 },
  delLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  delLinkText: { color: colors.textFaint, fontSize: 14 },
  confirm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmText: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  delBtn: {
    backgroundColor: "rgba(248,113,113,0.9)",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  delText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  cancelBtn: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: { color: colors.textMuted, fontSize: 14 },
});
