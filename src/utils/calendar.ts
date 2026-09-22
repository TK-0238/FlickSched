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

// 予定の日付・開始時刻・所要時間から、日をまたぐケースも含めて正しいDate範囲を作る
function getTaskDateRange(task: ScheduledTask): { startDate: Date; endDate: Date } {
  const [year, month, day] = task.date.split('-').map(Number);
  const [startH, startM] = task.startTime.split(':').map(Number);
  const values = [year, month, day, startH, startM, task.duration];
  if (!values.every(Number.isFinite) || task.duration <= 0) {
    throw new Error('Invalid scheduled task date/time');
  }

  const startDate = new Date(year, month - 1, day, startH, startM, 0, 0);
  const endDate = new Date(startDate.getTime() + task.duration * 60_000);
  return { startDate, endDate };
}

function formatLocalDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

// カレンダー権限リクエスト
export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// デフォルトカレンダーIDを取得
export async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  // 読み取り専用カレンダーを作成先に選ぶと createEventAsync が失敗する
  const writableCalendars = calendars.filter(c => c.allowsModifications !== false);

  if (Platform.OS === 'ios') {
    const defaultCal = writableCalendars.find(
      c => c.source?.name === 'iCloud' || c.source?.name === 'Default'
    );
    return defaultCal?.id || writableCalendars[0]?.id || null;
  } else {
    const defaultCal = writableCalendars.find(c => c.isPrimary);
    return defaultCal?.id || writableCalendars[0]?.id || null;
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

    const { startDate, endDate } = getTaskDateRange(task);

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

    const { startDate, endDate } = getTaskDateRange(task);
    const startDateTime = formatLocalDateTime(startDate);
    const endDateTime = formatLocalDateTime(endDate);
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
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          appleCalendarEnabled: parsed.appleCalendarEnabled === true,
          appleCalendarId: typeof parsed.appleCalendarId === 'string' ? parsed.appleCalendarId : undefined,
          googleCalendarEnabled: parsed.googleCalendarEnabled === true,
          googleAccessToken: typeof parsed.googleAccessToken === 'string' ? parsed.googleAccessToken : undefined,
          googleRefreshToken: typeof parsed.googleRefreshToken === 'string' ? parsed.googleRefreshToken : undefined,
        };
      }
    }
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
