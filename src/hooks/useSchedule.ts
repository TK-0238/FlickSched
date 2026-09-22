// スケジュール管理フック — 配置済みタスクの管理
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import { generateId, calcEndTime, findNextAvailableSlot, getTodayString } from '../utils/time';
import type { ScheduledTask, TaskTemplate } from '../types';

export function useSchedule() {
  const [scheduled, setScheduled] = useState<ScheduledTask[]>([]);
  // 非同期保存中でも常に最新の配列を参照し、連続操作で更新を失わないようにする
  const scheduledRef = useRef<ScheduledTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  // 読み込み
  const loadSchedule = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          scheduledRef.current = parsed;
          setScheduled(parsed);
        }
      }
    } catch (e) {
      console.error('スケジュール読み込みエラー:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存
  const saveSchedule = useCallback(async (items: ScheduledTask[]) => {
    try {
      // UIと参照値を先に更新することで、直後の操作も最新状態を基準にできる
      scheduledRef.current = items;
      setScheduled(items);
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(items));
    } catch (e) {
      console.error('スケジュール保存エラー:', e);
    }
  }, []);

  // タスクをスケジュールに追加（タップ→空き時間に自動配置）
  const scheduleTaskAuto = useCallback(async (
    template: TaskTemplate,
    date?: string
  ): Promise<ScheduledTask> => {
    const targetDate = date || selectedDate;
    const startTime = findNextAvailableSlot(
      targetDate,
      template.duration,
      scheduledRef.current,
      template.defaultStartTime
    );
    const endTime = calcEndTime(startTime, template.duration);

    const newTask: ScheduledTask = {
      id: generateId(),
      templateId: template.id,
      title: template.title,
      date: targetDate,
      startTime,
      endTime,
      duration: template.duration,
      color: template.color,
      icon: template.icon,
      memo: template.memo,
      synced: false,
    };

    const updated = [...scheduledRef.current, newTask];
    await saveSchedule(updated);
    return newTask;
  }, [scheduled, selectedDate, saveSchedule]);

  // タスクを指定時間にスケジュール（ドラッグで配置）
  const scheduleTaskAt = useCallback(async (
    template: TaskTemplate,
    startTime: string,
    date?: string
  ): Promise<ScheduledTask> => {
    const targetDate = date || selectedDate;
    const endTime = calcEndTime(startTime, template.duration);

    const newTask: ScheduledTask = {
      id: generateId(),
      templateId: template.id,
      title: template.title,
      date: targetDate,
      startTime,
      endTime,
      duration: template.duration,
      color: template.color,
      icon: template.icon,
      memo: template.memo,
      synced: false,
    };

    const updated = [...scheduledRef.current, newTask];
    await saveSchedule(updated);
    return newTask;
  }, [scheduled, selectedDate, saveSchedule]);

  // 配置済みタスクの時間変更
  const moveTask = useCallback(async (taskId: string, newStartTime: string) => {
    const updated = scheduledRef.current.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          startTime: newStartTime,
          endTime: calcEndTime(newStartTime, t.duration),
          synced: false,
        };
      }
      return t;
    });
    await saveSchedule(updated);
  }, [scheduled, saveSchedule]);

  // スケジュールからタスク削除
  const removeTask = useCallback(async (taskId: string) => {
    const updated = scheduledRef.current.filter(t => t.id !== taskId);
    await saveSchedule(updated);
  }, [scheduled, saveSchedule]);

  // 同期状態を更新
  const markSynced = useCallback(async (taskId: string, calendarEventId: string) => {
    const updated = scheduledRef.current.map(t => {
      if (t.id === taskId) {
        return { ...t, synced: true, calendarEventId };
      }
      return t;
    });
    await saveSchedule(updated);
  }, [scheduled, saveSchedule]);

  // 選択日のタスクだけ取得
  const todayTasks = scheduled
    .filter(t => t.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    scheduled,
    todayTasks,
    selectedDate,
    setSelectedDate,
    loading,
    scheduleTaskAuto,
    scheduleTaskAt,
    moveTask,
    removeTask,
    markSynced,
    reload: loadSchedule,
  };
}
