// カレンダー連携ユーティリティ — Apple Calendar & Google Calendar
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { ScheduledTask, CalendarSettings } from '../types';

// --- Google OAuth設定 ---
const GOOGLE_CLIENT_ID = '268060003785-oflc5n9ottcuc7ndscj58cldg9sjmsf5.apps.googleusercontent.com';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export { GOOGLE_CLIENT_ID, GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL, GOOGLE_SCOPES };

// カレンダー権限リクエスト
export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// デフォルトカレンダーIDを取得
export async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (Platform.OS === 'ios') {
    const defaultCal = calendars.find(
      c => c.source?.name === 'iCloud' || c.source?.name === 'Default'
    );
    return defaultCal?.id || calendars[0]?.id || null;
  } else {
    const defaultCal = calendars.find(c => c.isPrimary);
    return defaultCal?.id || calendars[0]?.id || null;
  }
}

// 利用可能なカレンダー一覧
export async function getAvailableCalendars() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.map(c => ({
    id: c.id,
    title: c.title,
    color: c.color,
    source: c.source?.name,
    allowsModifications: c.allowsModifications,
  }));
}

// Apple Calendar にイベント追加
export async function addToAppleCalendar(
  task: ScheduledTask,
  calendarId?: string
): Promise<string | null> {
  try {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) return null;

    const targetCalendarId = calendarId || await getDefaultCalendarId();
    if (!targetCalendarId) return null;

    const [year, month, day] = task.date.split('-').map(Number);
    const [startH, startM] = task.startTime.split(':').map(Number);
    const [endH, endM] = task.endTime.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, startH, startM);
    const endDate = new Date(year, month - 1, day, endH, endM);

    const eventId = await Calendar.createEventAsync(targetCalendarId, {
      title: `${task.icon} ${task.title}`,
      startDate,
      endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: 'サクヨテから追加',
    });

    return eventId;
  } catch (e) {
    console.error('Apple Calendar追加エラー:', e);
    return null;
  }
}

// --- Google Calendar REST API ---

// Googleアクセストークンを保存
export async function saveGoogleToken(accessToken: string): Promise<void> {
  const settings = await loadCalendarSettings();
  settings.googleAccessToken = accessToken;
  settings.googleCalendarEnabled = true;
  await saveCalendarSettings(settings);
}

// Googleアクセストークンを取得
export async function getGoogleToken(): Promise<string | null> {
  const settings = await loadCalendarSettings();
  return settings.googleAccessToken || null;
}

// Google認証を切断
export async function disconnectGoogle(): Promise<void> {
  const settings = await loadCalendarSettings();
  // トークンを無効化（revoke）
  if (settings.googleAccessToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${settings.googleAccessToken}`, {
        method: 'POST',
      });
    } catch (e) {
      // revokeに失敗しても続行
    }
  }
  settings.googleCalendarEnabled = false;
  settings.googleAccessToken = undefined;
  settings.googleRefreshToken = undefined;
  await saveCalendarSettings(settings);
}

// Google Calendar にイベント追加
export async function addToGoogleCalendar(
  task: ScheduledTask,
  accessToken?: string
): Promise<string | null> {
  try {
    const token = accessToken || await getGoogleToken();
    if (!token) return null;

    const startDateTime = `${task.date}T${task.startTime}:00`;
    const endDateTime = `${task.date}T${task.endTime}:00`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `${task.icon} ${task.title}`,
          description: 'サクヨテから追加',
          start: { dateTime: startDateTime, timeZone },
          end: { dateTime: endDateTime, timeZone },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar APIエラー:', errorText);
      // トークン期限切れの場合
      if (response.status === 401) {
        await disconnectGoogle();
      }
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (e) {
    console.error('Google Calendar追加エラー:', e);
    return null;
  }
}

// カレンダー設定の読み書き
export async function loadCalendarSettings(): Promise<CalendarSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('設定読み込みエラー:', e);
  }
  return {
    appleCalendarEnabled: false,
    googleCalendarEnabled: false,
  };
}

export async function saveCalendarSettings(settings: CalendarSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
