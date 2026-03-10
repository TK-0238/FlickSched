// 設定画面 — カレンダー連携・アプリ情報
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../src/constants';
import {
  requestCalendarPermission,
  getAvailableCalendars,
  loadCalendarSettings,
  saveCalendarSettings,
} from '../src/utils/calendar';
import type { CalendarSettings } from '../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<CalendarSettings>({
    appleCalendarEnabled: false,
    googleCalendarEnabled: false,
  });
  const [calendars, setCalendars] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await loadCalendarSettings();
    setSettings(s);
    if (s.appleCalendarEnabled) {
      // 接続済みならカレンダー一覧を取得
      try {
        const cals = await getAvailableCalendars();
        setCalendars(cals);
      } catch (e) {
        // 権限なし
      }
    }
  };

  // Appleカレンダー接続/切断
  const handleAppleCalendarConnect = async () => {
    if (settings.appleCalendarEnabled) {
      // 切断
      const updated = { ...settings, appleCalendarEnabled: false };
      setSettings(updated);
      setCalendars([]);
      await saveCalendarSettings(updated);
      return;
    }

    // 接続
    setConnecting(true);
    try {
      const granted = await requestCalendarPermission();
      if (!granted) {
        Alert.alert('権限エラー', '設定アプリからカレンダーへのアクセスを許可してください');
        setConnecting(false);
        return;
      }
      const cals = await getAvailableCalendars();
      setCalendars(cals);
      const updated = { ...settings, appleCalendarEnabled: true };
      setSettings(updated);
      await saveCalendarSettings(updated);
    } catch (e) {
      Alert.alert('エラー', 'カレンダーへの接続に失敗しました');
    }
    setConnecting(false);
  };

  // Googleカレンダー（未実装）
  const handleGoogleCalendarConnect = () => {
    Alert.alert(
      'Googleカレンダー',
      'Googleカレンダー連携は今後のアップデートで対応予定です。',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* カレンダー連携 */}
        <Text style={styles.sectionTitle}>📅 カレンダー連携</Text>

        {/* Appleカレンダー */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarCardHeader}>
            <Text style={styles.calendarIcon}>🍎</Text>
            <View style={styles.calendarCardInfo}>
              <Text style={styles.calendarCardTitle}>Appleカレンダー</Text>
              <Text style={styles.calendarCardHint}>
                {settings.appleCalendarEnabled
                  ? `✅ 接続済み（${calendars.length}件のカレンダー）`
                  : '端末のカレンダーに予定を追加'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleAppleCalendarConnect}
            disabled={connecting}
            style={({ pressed }) => [
              styles.connectBtn,
              settings.appleCalendarEnabled && styles.disconnectBtn,
              pressed && styles.btnPressed,
            ]}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.connectBtnText,
                settings.appleCalendarEnabled && styles.disconnectBtnText,
              ]}>
                {settings.appleCalendarEnabled ? '切断する' : '接続する'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Googleカレンダー */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarCardHeader}>
            <Text style={styles.calendarIcon}>📆</Text>
            <View style={styles.calendarCardInfo}>
              <Text style={styles.calendarCardTitle}>Googleカレンダー</Text>
              <Text style={styles.calendarCardHint}>今後対応予定</Text>
            </View>
          </View>
          <Pressable
            onPress={handleGoogleCalendarConnect}
            style={({ pressed }) => [
              styles.connectBtn,
              styles.comingSoonBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={[styles.connectBtnText, styles.comingSoonText]}>準備中</Text>
          </Pressable>
        </View>

        {/* 接続済みカレンダー一覧 */}
        {calendars.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📋 検出されたカレンダー</Text>
            {calendars.map(cal => (
              <View key={cal.id} style={styles.calendarItem}>
                <View
                  style={[styles.calendarDot, { backgroundColor: cal.color || COLORS.primary }]}
                />
                <View style={styles.calendarInfo}>
                  <Text style={styles.calendarName}>{cal.title}</Text>
                  <Text style={styles.calendarSource}>{cal.source}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* アプリ情報 */}
        <Text style={styles.sectionTitle}>ℹ️ アプリ情報</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>フリスケ v1.0.0</Text>
          <Text style={styles.infoSubtext}>
            予定を立てるのがめんどくさい人のための{'\n'}
            ワンタップスケジューリングアプリ
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  // カレンダーカード
  calendarCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  calendarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  calendarCardInfo: {
    flex: 1,
  },
  calendarCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  calendarCardHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  // 接続ボタン
  connectBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  disconnectBtn: {
    backgroundColor: 'rgba(255,107,107,0.15)',
  },
  disconnectBtnText: {
    color: '#FF6B6B',
  },
  comingSoonBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  comingSoonText: {
    color: COLORS.textMuted,
  },
  btnPressed: {
    opacity: 0.7,
  },
  // カレンダー一覧
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  calendarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  calendarSource: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // アプリ情報
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
