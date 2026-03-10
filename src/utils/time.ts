// 日付・時間関連のユーティリティ
import { format, addMinutes, parse, isAfter, isBefore, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TIMELINE } from '../constants';
import type { ScheduledTask, TimeSlot } from '../types';

// 現在の日付を "2026-03-10" 形式で取得
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// 明日の日付を取得
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(tomorrow, 'yyyy-MM-dd');
}

// 日付表示用のフォーマット "3月10日（月）"
export function formatDateDisplay(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, 'M月d日（E）', { locale: ja });
}

// "09:00" → 分数（540）
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// 分数 → "09:00"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 終了時刻を計算
export function calcEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  return minutesToTime(startMinutes + durationMinutes);
}

// タイムライン上のY座標 → 時間（分単位）に変換
export function yPositionToMinutes(y: number): number {
  const totalMinutes = (y / TIMELINE.HOUR_HEIGHT) * 60;
  // 30分刻みにスナップ
  const snapped = Math.round(totalMinutes / TIMELINE.SLOT_INTERVAL) * TIMELINE.SLOT_INTERVAL;
  return Math.max(0, Math.min(snapped, 24 * 60 - TIMELINE.SLOT_INTERVAL));
}

// 時間（分） → タイムライン上のY座標
export function minutesToYPosition(minutes: number): number {
  return (minutes / 60) * TIMELINE.HOUR_HEIGHT;
}

// 指定日の空き時間を見つける（次の空きスロット）
export function findNextAvailableSlot(
  date: string,
  duration: number,
  scheduled: ScheduledTask[],
  preferredStartTime?: string
): string {
  const dayTasks = scheduled
    .filter(t => t.date === date)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // 優先開始時刻がある場合はそこから、なければ現在時刻から
  let searchStart: number;
  if (preferredStartTime) {
    searchStart = timeToMinutes(preferredStartTime);
  } else {
    const now = new Date();
    if (date === getTodayString()) {
      // 今日なら現在時刻の次の30分刻み
      searchStart = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
    } else {
      searchStart = 9 * 60; // 他の日は9:00から
    }
  }

  // 空きスロットを探索
  for (let start = searchStart; start + duration <= 24 * 60; start += TIMELINE.SLOT_INTERVAL) {
    const end = start + duration;
    const conflict = dayTasks.some(task => {
      const taskStart = timeToMinutes(task.startTime);
      const taskEnd = timeToMinutes(task.endTime);
      return start < taskEnd && end > taskStart;
    });
    if (!conflict) {
      return minutesToTime(start);
    }
  }

  // 0:00から再検索（searchStartより前）
  for (let start = 0; start < searchStart && start + duration <= 24 * 60; start += TIMELINE.SLOT_INTERVAL) {
    const end = start + duration;
    const conflict = dayTasks.some(task => {
      const taskStart = timeToMinutes(task.startTime);
      const taskEnd = timeToMinutes(task.endTime);
      return start < taskEnd && end > taskStart;
    });
    if (!conflict) {
      return minutesToTime(start);
    }
  }

  // 空きがない場合はデフォルト
  return preferredStartTime || '09:00';
}

// 時間の重複チェック
export function hasConflict(
  startTime: string,
  duration: number,
  scheduled: ScheduledTask[],
  date: string,
  excludeId?: string
): ScheduledTask | null {
  const startMin = timeToMinutes(startTime);
  const endMin = startMin + duration;
  return scheduled.find(task => {
    if (task.date !== date) return false;
    if (excludeId && task.id === excludeId) return false;
    const taskStart = timeToMinutes(task.startTime);
    const taskEnd = timeToMinutes(task.endTime);
    return startMin < taskEnd && endMin > taskStart;
  }) || null;
}

// UUIDの簡易生成
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 時間の配列を生成（タイムライン描画用）
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = TIMELINE.START_HOUR; h < TIMELINE.END_HOUR; h++) {
    slots.push({
      hour: h,
      minute: 0,
      label: `${h.toString().padStart(2, '0')}:00`,
    });
  }
  return slots;
}
