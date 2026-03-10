// 設定画面 — カレンダー連携・アプリ情報
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await loadCalendarSettings();
    setSettings(s);
    // カレンダー一覧も取得
    try {
      const granted = await requestCalendarPermission();
      if (granted) {
        const cals = await getAvailableCalendars();
        setCalendars(cals);
      }
    } catch (e) {
      // 権限なし
    }
  };

  const toggleAppleCalendar = async (value: boolean) => {
    if (value) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        Alert.alert('権限エラー', '設定からカレンダーへのアクセスを許可してください');
        return;
      }
    }
    const updated = { ...settings, appleCalendarEnabled: value };
    setSettings(updated);
    await saveCalendarSettings(updated);
  };

  const toggleGoogleCalendar = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Google Calendar',
        'Google Calendar連携は開発者設定（OAuth クライアントID）が必要です。\n\n設定後にこの機能が利用可能になります。',
        [{ text: 'OK' }]
      );
      return;
    }
    const updated = { ...settings, googleCalendarEnabled: value };
    setSettings(updated);
    await saveCalendarSettings(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* カレンダー連携 */}
        <Text style={styles.sectionTitle}>📅 カレンダー連携</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Apple Calendar</Text>
            <Text style={styles.settingHint}>デバイスのカレンダーに予定を追加</Text>
          </View>
          <Switch
            value={settings.appleCalendarEnabled}
            onValueChange={toggleAppleCalendar}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Google Calendar</Text>
            <Text style={styles.settingHint}>Googleアカウントのカレンダーに追加</Text>
          </View>
          <Switch
            value={settings.googleCalendarEnabled}
            onValueChange={toggleGoogleCalendar}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* 利用可能なカレンダー一覧 */}
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

        {/* 使い方 */}
        <Text style={styles.sectionTitle}>💡 使い方</Text>
        <View style={styles.helpCard}>
          <Text style={styles.helpItem}>👆 <Text style={styles.helpBold}>タップ</Text> → 空き時間に自動追加</Text>
          <Text style={styles.helpItem}>👆 <Text style={styles.helpBold}>長押し</Text> → 付箋を編集</Text>
          <Text style={styles.helpItem}>📅 配置済みの予定をタップ → カレンダーに同期</Text>
          <Text style={styles.helpItem}>🗑️ 配置済みの予定を長押し → 削除</Text>
        </View>

        {/* アプリ情報 */}
        <Text style={styles.sectionTitle}>ℹ️ アプリ情報</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>FlickSched v1.0.0</Text>
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
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
  helpCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  helpItem: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  helpBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
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
