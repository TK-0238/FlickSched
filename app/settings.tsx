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
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '../src/constants';
import {
  requestCalendarPermission,
  getAvailableCalendars,
  loadCalendarSettings,
  saveCalendarSettings,
  saveGoogleToken,
  disconnectGoogle,
  GOOGLE_CLIENT_ID,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  GOOGLE_SCOPES,
} from '../src/utils/calendar';
import type { CalendarSettings } from '../src/types';

// Expo Goでのリダイレクト処理に必要
WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<CalendarSettings>({
    appleCalendarEnabled: false,
    googleCalendarEnabled: false,
  });
  const [calendars, setCalendars] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);

  // Google OAuth設定
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: GOOGLE_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      // PKCEをスキップ（暗黙的フロー）
      usePKCE: false,
    },
    { authorizationEndpoint: GOOGLE_AUTH_URL }
  );

  useEffect(() => {
    loadSettings();
  }, []);

  // OAuthレスポンスを処理
  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      if (access_token) {
        handleGoogleTokenReceived(access_token);
      }
    } else if (response?.type === 'error') {
      setGoogleConnecting(false);
      Alert.alert('認証エラー', 'Googleアカウントへの接続に失敗しました。');
    } else if (response?.type === 'dismiss') {
      setGoogleConnecting(false);
    }
  }, [response]);

  const handleGoogleTokenReceived = async (token: string) => {
    try {
      await saveGoogleToken(token);
      const s = await loadCalendarSettings();
      setSettings(s);
      Alert.alert('✅ 接続完了', 'Googleカレンダーに接続しました！');
    } catch (e) {
      Alert.alert('エラー', 'トークンの保存に失敗しました');
    }
    setGoogleConnecting(false);
  };

  const loadSettings = async () => {
    const s = await loadCalendarSettings();
    setSettings(s);
    if (s.appleCalendarEnabled) {
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
      const updated = { ...settings, appleCalendarEnabled: false };
      setSettings(updated);
      setCalendars([]);
      await saveCalendarSettings(updated);
      return;
    }

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

  // Googleカレンダー接続
  const handleGoogleCalendarConnect = async () => {
    if (settings.googleCalendarEnabled) {
      // 切断
      await disconnectGoogle();
      const s = await loadCalendarSettings();
      setSettings(s);
      return;
    }

    // OAuth開始
    setGoogleConnecting(true);
    try {
      await promptAsync();
    } catch (e) {
      setGoogleConnecting(false);
      Alert.alert('エラー', 'Google認証の起動に失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* カスタムヘッダー（閉じるボタン付き） */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ 設定</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.closeBtnText}>✕ 閉じる</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.calendarCardHint}>
                {settings.googleCalendarEnabled
                  ? '✅ 接続済み'
                  : 'Googleアカウントのカレンダーに追加'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleGoogleCalendarConnect}
            disabled={googleConnecting || !request}
            style={({ pressed }) => [
              styles.connectBtn,
              settings.googleCalendarEnabled && styles.disconnectBtn,
              pressed && styles.btnPressed,
            ]}
          >
            {googleConnecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.connectBtnText,
                settings.googleCalendarEnabled && styles.disconnectBtnText,
              ]}>
                {settings.googleCalendarEnabled ? '切断する' : 'Googleでログイン'}
              </Text>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
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
