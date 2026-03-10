// メインホーム画面 — タイムライン + 付箋トレイ + ドラッグ配置
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { COLORS, TIMELINE } from '../src/constants';
import { useTasks } from '../src/hooks/useTasks';
import { useSchedule } from '../src/hooks/useSchedule';
import { minutesToYPosition, minutesToTime, yPositionToMinutes, hasConflict } from '../src/utils/time';
import { addToAppleCalendar, addToGoogleCalendar, loadCalendarSettings } from '../src/utils/calendar';

// コンポーネント
import { Timeline } from '../src/components/Timeline';
import { StickyTray } from '../src/components/StickyTray';
import { DateNavigator } from '../src/components/DateNavigator';
import { TaskEditor } from '../src/components/TaskEditor';
import { TaskActionModal } from '../src/components/TaskActionModal';
import { FlyAnimation } from '../src/components/FlyAnimation';
import { Toast } from '../src/components/Toast';
import { Onboarding } from '../src/components/Onboarding';

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

  // タイムラインのレイアウト情報（ドラッグ→時間変換用）
  const timelineTopRef = useRef(0);
  const timelineScrollOffsetRef = useRef(0);

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

  // オンボーディング状態
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 初回起動チェック
  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('@flicksched/onboarding_seen');
      if (!seen) {
        setShowOnboarding(true);
      }
    })();
  }, []);

  const handleCloseOnboarding = useCallback(async () => {
    setShowOnboarding(false);
    await AsyncStorage.setItem('@flicksched/onboarding_seen', 'true');
  }, []);

  // ドラッグプレビュー状態
  const [dragPreview, setDragPreview] = useState<{
    visible: boolean;
    timeLabel: string;
    y: number;
  }>({ visible: false, timeLabel: '', y: 0 });
  const dragPreviewOpacity = useSharedValue(0);

  // タイムラインの画面上の位置を測定
  const handleTimelineLayout = useCallback((event: LayoutChangeEvent) => {
    event.target.measureInWindow((_x: number, y: number) => {
      timelineTopRef.current = y;
    });
  }, []);

  // スクロールオフセットを追跡
  const handleTimelineScroll = useCallback((event: any) => {
    timelineScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  // ドラッグ中のY座標 → タイムライン上の時間を計算
  const calcTimeFromDragY = useCallback((absoluteY: number): { minutes: number; timeStr: string } | null => {
    const relativeY = absoluteY - timelineTopRef.current + timelineScrollOffsetRef.current;
    if (relativeY < 0) return null;
    const minutes = yPositionToMinutes(relativeY);
    return { minutes, timeStr: minutesToTime(minutes) };
  }, []);

  // --- 付箋タップ → タイムラインに飛ぶ ---
  const handleTapTask = useCallback(async (template: TaskTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const scheduled = await scheduleTaskAuto(template);
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
    setTimeout(() => {
      scrollToTime(parseInt(scheduled.startTime.split(':')[0]) * 60 +
        parseInt(scheduled.startTime.split(':')[1]));
    }, 300);
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

  // --- ドラッグ開始 ---
  const handleDragStart = useCallback((_template: TaskTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dragPreviewOpacity.value = withTiming(1, { duration: 150 });
  }, []);

  // --- ドラッグ中（プレビュー更新） ---
  const handleDragMove = useCallback((_template: TaskTemplate, absoluteY: number) => {
    const result = calcTimeFromDragY(absoluteY);
    if (result) {
      setDragPreview({
        visible: true,
        timeLabel: result.timeStr,
        y: absoluteY,
      });
    }
  }, [calcTimeFromDragY]);

  // --- ドラッグ終了（タイムラインにドロップ） ---
  const handleDragEnd = useCallback(async (template: TaskTemplate, absoluteY: number) => {
    dragPreviewOpacity.value = withTiming(0, { duration: 150 });
    setDragPreview(prev => ({ ...prev, visible: false }));

    const result = calcTimeFromDragY(absoluteY);
    if (result && absoluteY < timelineTopRef.current + SCREEN_HEIGHT * 0.6) {
      // 重複チェック
      const conflict = hasConflict(result.timeStr, template.duration, todayTasks, selectedDate);
      if (conflict) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          '⚠️ 時間が重複しています',
          `${result.timeStr}には「${conflict.title}」(${conflict.startTime}〜${conflict.endTime})が入っています。\n上書きして配置しますか？`,
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '配置する',
              onPress: async () => {
                const scheduled = await scheduleTaskAt(template, result.timeStr);
                scrollToTime(result.minutes);
                setToast({
                  visible: true,
                  message: `${template.icon} ${template.title} → ${result.timeStr}に配置！`,
                  type: 'success',
                });
              },
            },
          ]
        );
        return;
      }

      // 重複なし → そのまま配置
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const scheduled = await scheduleTaskAt(template, result.timeStr);
      scrollToTime(result.minutes);
      setToast({
        visible: true,
        message: `${template.icon} ${template.title} → ${result.timeStr}に配置！`,
        type: 'success',
      });
    }
    // タイムライン外にドロップした場合は何もしない（付箋が元の位置に戻る）
  }, [calcTimeFromDragY, scheduleTaskAt, todayTasks, selectedDate]);

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

  // --- カレンダー同期（Apple + Google対応）---
  const handleSyncCalendar = useCallback(async (task: ScheduledTask) => {
    try {
      const calSettings = await loadCalendarSettings();
      let synced = false;

      // Appleカレンダー
      if (calSettings.appleCalendarEnabled) {
        const eventId = await addToAppleCalendar(task);
        if (eventId) {
          await markSynced(task.id, eventId);
          synced = true;
        }
      }

      // Googleカレンダー
      if (calSettings.googleCalendarEnabled && calSettings.googleAccessToken) {
        const eventId = await addToGoogleCalendar(task);
        if (eventId) {
          await markSynced(task.id, eventId);
          synced = true;
        }
      }

      if (synced) {
        setToast({
          visible: true,
          message: `📅 カレンダーに追加しました！`,
          type: 'success',
        });
      } else if (!calSettings.appleCalendarEnabled && !calSettings.googleCalendarEnabled) {
        setToast({
          visible: true,
          message: '設定からカレンダーを接続してください',
          type: 'error',
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
  const handleTimeSlotPress = useCallback((_minutes: number) => {
    // 将来: 空き時間タップから直接タスクを追加
  }, []);

  // --- タイムラインの指定分位置にスクロール ---
  const scrollToTime = useCallback((minutes: number) => {
    const targetY = minutesToYPosition(minutes);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, targetY - 100),
        animated: true,
      });
    }, 200);
  }, []);

  // --- 左スワイプ削除 ---
  const handleSwipeDelete = useCallback(async (task: ScheduledTask) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await removeTask(task.id);
    setToast({ visible: true, message: `${task.icon} ${task.title} を削除しました`, type: 'info' });
  }, [removeTask]);

  // --- 一括カレンダー同期（Apple + Google両対応）---
  const handleSyncAll = useCallback(async () => {
    const unsyncedTasks = todayTasks.filter(t => !t.synced);
    if (unsyncedTasks.length === 0) {
      setToast({ visible: true, message: '同期するタスクがありません', type: 'info' });
      return;
    }

    const calSettings = await loadCalendarSettings();
    if (!calSettings.appleCalendarEnabled && !calSettings.googleCalendarEnabled) {
      setToast({ visible: true, message: '設定からカレンダーを接続してください', type: 'error' });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let successCount = 0;
    for (const task of unsyncedTasks) {
      try {
        let eventId: string | null = null;

        if (calSettings.appleCalendarEnabled) {
          eventId = await addToAppleCalendar(task);
        }
        if (calSettings.googleCalendarEnabled && calSettings.googleAccessToken) {
          const gEventId = await addToGoogleCalendar(task);
          if (gEventId) eventId = gEventId;
        }

        if (eventId) {
          await markSynced(task.id, eventId);
          successCount++;
        }
      } catch (e) {
        console.error('同期エラー:', e);
      }
    }
    setToast({
      visible: true,
      message: `📅 ${successCount}件をカレンダーに同期しました！`,
      type: successCount > 0 ? 'success' : 'error',
    });
  }, [todayTasks, markSynced]);

  // ドラッグプレビューのアニメーションスタイル
  const dragPreviewStyle = useAnimatedStyle(() => ({
    opacity: dragPreviewOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ヘッダー */}
        <LinearGradient
          colors={[COLORS.headerGradientStart, COLORS.headerGradientEnd]}
          style={styles.header}
        >
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.settingsBtnText}>⚙ 設定</Text>
          </Pressable>
          <Text style={styles.appTitle}>⚡ フリスケ</Text>
          <View style={styles.headerRight}>
            {todayTasks.length > 0 && (
              <Pressable
                onPress={handleSyncAll}
                style={({ pressed }) => [styles.syncAllBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.syncAllText}>
                  {todayTasks.filter(t => !t.synced).length > 0
                    ? `📅 ${todayTasks.filter(t => !t.synced).length}件`
                    : '✓ 同期済'}
                </Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {/* 日付ナビゲーション */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* タイムライン */}
        <View
          style={styles.timelineWrapper}
          onLayout={handleTimelineLayout}
        >
          <Timeline
            tasks={todayTasks}
            onTaskPress={handleScheduledTaskPress}
            onTaskLongPress={handleScheduledTaskLongPress}
            onTimeSlotPress={handleTimeSlotPress}
            onSwipeDelete={handleSwipeDelete}
            scrollViewRef={scrollViewRef}
            onScroll={handleTimelineScroll}
          />
        </View>

        {/* 付箋トレイ */}
        <StickyTray
          tasks={tasks}
          onTapTask={handleTapTask}
          onLongPressTask={handleLongPressTask}
          onAddNew={handleAddNew}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />

        {/* ドラッグ中の時刻プレビュー */}
        {dragPreview.visible && (
          <Animated.View
            style={[
              styles.dragTimePreview,
              { top: dragPreview.y - 50 },
              dragPreviewStyle,
            ]}
          >
            <Text style={styles.dragTimeText}>🕐 {dragPreview.timeLabel}</Text>
          </Animated.View>
        )}

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

        {/* 初回起動時オンボーディング */}
        <Onboarding
          visible={showOnboarding}
          onClose={handleCloseOnboarding}
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncAllBtn: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  syncAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  settingsBtn: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  timelineWrapper: {
    flex: 1,
  },
  dragTimePreview: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 50,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    zIndex: 999,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  dragTimeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});
