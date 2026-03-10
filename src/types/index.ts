// タスクテンプレート — 事前登録する付箋のデータ構造
export interface TaskTemplate {
  id: string;
  title: string;           // 例: "会議", "ランチ", "ジム"
  duration: number;        // 分単位 (15, 30, 60, 90...)
  color: string;           // 付箋の色コード
  icon: string;            // emoji
  defaultStartTime?: string; // デフォルト開始時刻 "09:00"
  category?: string;       // カテゴリ
  memo?: string;           // メモ（自由記入）
}

// タイムラインに配置済みの予定
export interface ScheduledTask {
  id: string;
  templateId: string;
  title: string;
  date: string;            // "2026-03-10"
  startTime: string;       // "09:00"
  endTime: string;         // "10:00"
  duration: number;
  color: string;
  icon: string;
  memo?: string;           // メモ
  calendarEventId?: string; // カレンダー連携済みの場合
  synced: boolean;         // カレンダーに同期済みか
}

// カレンダー設定
export interface CalendarSettings {
  appleCalendarEnabled: boolean;
  appleCalendarId?: string;
  googleCalendarEnabled: boolean;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

// 時間スロット（タイムライン描画用）
export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;           // "09:00"
}
