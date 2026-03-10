// タスクテンプレート管理フック — AsyncStorageで永続化
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, SAMPLE_TASKS, STICKY_COLORS } from '../constants';
import { generateId } from '../utils/time';
import type { TaskTemplate } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // 初回読み込み
  useEffect(() => {
    loadTasks();
  }, []);

  // AsyncStorageからタスク読み込み
  const loadTasks = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        // 初回起動時はサンプルタスクを設定
        const samples: TaskTemplate[] = SAMPLE_TASKS.map((s, i) => ({
          id: generateId() + i,
          title: s.title,
          duration: s.duration,
          color: s.color,
          icon: s.icon,
          defaultStartTime: s.defaultStartTime,
        }));
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(samples));
        setTasks(samples);
      }
    } catch (e) {
      console.error('タスク読み込みエラー:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // タスクを保存
  const saveTasks = useCallback(async (newTasks: TaskTemplate[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (e) {
      console.error('タスク保存エラー:', e);
    }
  }, []);

  // タスク追加
  const addTask = useCallback(async (task: Omit<TaskTemplate, 'id'>) => {
    const newTask: TaskTemplate = { ...task, id: generateId() };
    const updated = [...tasks, newTask];
    await saveTasks(updated);
    return newTask;
  }, [tasks, saveTasks]);

  // タスク更新
  const updateTask = useCallback(async (id: string, updates: Partial<TaskTemplate>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    await saveTasks(updated);
  }, [tasks, saveTasks]);

  // タスク削除
  const deleteTask = useCallback(async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    await saveTasks(updated);
  }, [tasks, saveTasks]);

  // タスク並び替え（左右移動）
  const reorderTask = useCallback(async (id: string, direction: 'left' | 'right') => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tasks.length) return;
    const updated = [...tasks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    await saveTasks(updated);
  }, [tasks, saveTasks]);

  return { tasks, loading, addTask, updateTask, deleteTask, reorderTask, reload: loadTasks };
}
