// メインホーム画面 — タイムライン + 付箋トレイ
import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { COLORS, TIMELINE } from '../src/constants';
import { useTasks } from '../src/hooks/useTasks';
import { useSchedule } from '../src/hooks/useSchedule';
import { minutesToYPosition, minutesToTime, yPositionToMinutes } from '../src/utils/time';
import { addToAppleCalendar } from '../src/utils/calendar';

// コンポーネント
import { Timeline } from '../src/components/Timeline';
import { StickyTray } from '../src/components/StickyTray';
import { DateNavigator } from '../src/components/DateNavigator';
import { TaskEditor } from '../src/components/TaskEditor';
import { TaskActionModal } from '../src/components/TaskActionModal';
import { FlyAnimation } from '../src/components/FlyAnimation';
import { Toast } from '../src/components/Toast';

import type { TaskTemplate, ScheduledTask } from '../src/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const router = useRouter();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const {
    todayTasks,
    selectedDate,
    setSelectedDate,
    scheduleTaskAuto,
    scheduleTaskAt,
    moveTask,
    removeTask,
    markSynced,
  } = useSchedule();

  const scrollViewRef = useRef<ScrollView>(null);

  // モーダル状態
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedScheduledTask, setSelectedScheduledTask] = useState<ScheduledTask | null>(null);

  // フライアニメーション状態
  const [flyVisible, setFlyVisible] = useState(false);
  const [flyData, setFlyData] = useState({
    color: '#4ECDC4',
    icon: '💼',
    title: '',
    toY: 0,
  });

  // トースト状態
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  // --- 付箋タップ → タイムラインに飛ぶ ---
  const handleTapTask = useCallback(async (template: TaskTemplate) => {
    // 触覚フィードバック
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // スケジュールに自動追加
    const scheduled = await scheduleTaskAuto(template);

    // フライアニメーション
    const targetY = minutesToYPosition(
      parseInt(scheduled.startTime.split(':')[0]) * 60 +
      parseInt(scheduled.startTime.split(':')[1])
    );

    setFlyData({
      color: template.color,
      icon: template.icon,
      title: template.title,
      toY: Math.min(targetY, SCREEN_HEIGHT * 0.4),
    });
    setFlyVisible(true);

    // タイムラインを該当時間にスクロール
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, targetY - 100),
        animated: true,
      });
    }, 300);

    // トースト表示
    setToast({
      visible: true,
      message: `${template.icon} ${template.title} → ${scheduled.startTime}に追加！`,
      type: 'success',
    });
  }, [scheduleTaskAuto]);

  // --- 付箋長押し → 編集 ---
  const handleLongPressTask = useCallback((template: TaskTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEditingTask(template);
    setEditorVisible(true);
  }, []);

  // --- 新規タスク作成 ---
  const handleAddNew = useCallback(() => {
    setEditingTask(null);
    setEditorVisible(true);
  }, []);

  // --- タスク保存（新規/編集） ---
  const handleSaveTask = useCallback(async (taskData: Omit<TaskTemplate, 'id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      setToast({ visible: true, message: '付箋を更新しました', type: 'info' });
    } else {
      await addTask(taskData);
      setToast({ visible: true, message: '新しい付箋を作成しました！', type: 'success' });
    }
  }, [editingTask, updateTask, addTask]);

  // --- 配置済みタスクタップ ---
  const handleScheduledTaskPress = useCallback((task: ScheduledTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedScheduledTask(task);
    setActionModalVisible(true);
  }, []);

  // --- 配置済みタスク長押し → 削除確認 ---
  const handleScheduledTaskLongPress = useCallback((task: ScheduledTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '予定の削除',
      `「${task.title}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await removeTask(task.id);
            setToast({ visible: true, message: '予定を削除しました', type: 'info' });
          },
        },
      ]
    );
  }, [removeTask]);

  // --- カレンダー同期 ---
  const handleSyncCalendar = useCallback(async (task: ScheduledTask) => {
    try {
      const eventId = await addToAppleCalendar(task);
      if (eventId) {
        await markSynced(task.id, eventId);
        setToast({
          visible: true,
          message: `📅 カレンダーに追加しました！`,
          type: 'success',
        });
      } else {
        setToast({
          visible: true,
          message: 'カレンダーへのアクセスを許可してください',
          type: 'error',
        });
      }
    } catch (e) {
      setToast({
        visible: true,
        message: 'カレンダー追加に失敗しました',
        type: 'error',
      });
    }
  }, [markSynced]);

  // --- タイムスロットタップ ---
  const handleTimeSlotPress = useCallback((minutes: number) => {
    // タイムスロットをタップした時は何もしない（将来的に空き時間からタスク追加）
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>⚡ FlickSched</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.settingsBtn}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* 日付ナビゲーション */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* タイムライン */}
        <Timeline
          tasks={todayTasks}
          onTaskPress={handleScheduledTaskPress}
          onTaskLongPress={handleScheduledTaskLongPress}
          onTimeSlotPress={handleTimeSlotPress}
          scrollViewRef={scrollViewRef}
        />

        {/* 付箋トレイ */}
        <StickyTray
          tasks={tasks}
          onTapTask={handleTapTask}
          onLongPressTask={handleLongPressTask}
          onAddNew={handleAddNew}
        />

        {/* フライアニメーション */}
        <FlyAnimation
          visible={flyVisible}
          color={flyData.color}
          icon={flyData.icon}
          title={flyData.title}
          fromX={SCREEN_WIDTH / 2 - 45}
          fromY={SCREEN_HEIGHT - 200}
          toX={SCREEN_WIDTH / 2 - 45}
          toY={flyData.toY}
          onComplete={() => setFlyVisible(false)}
        />

        {/* トースト */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
        />

        {/* タスク編集モーダル */}
        <TaskEditor
          visible={editorVisible}
          task={editingTask}
          onSave={handleSaveTask}
          onDelete={editingTask ? async (id) => {
            await deleteTask(id);
            setToast({ visible: true, message: '付箋を削除しました', type: 'info' });
          } : undefined}
          onClose={() => setEditorVisible(false)}
        />

        {/* タスクアクションモーダル */}
        <TaskActionModal
          visible={actionModalVisible}
          task={selectedScheduledTask}
          onSyncCalendar={handleSyncCalendar}
          onRemove={async (task) => {
            await removeTask(task.id);
            setToast({ visible: true, message: '予定を削除しました', type: 'info' });
          }}
          onClose={() => setActionModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  settingsBtn: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 22,
  },
});
