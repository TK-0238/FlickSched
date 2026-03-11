// タイムライン — モダンデザインの0〜24時縦スクロール + スワイプ削除
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TIMELINE } from '../constants';
import { generateTimeSlots, minutesToYPosition, timeToMinutes, yPositionToMinutes } from '../utils/time';
import type { ScheduledTask } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  tasks: ScheduledTask[];
  onTaskPress: (task: ScheduledTask) => void;
  onTaskLongPress: (task: ScheduledTask) => void;
  onTimeSlotPress: (minutes: number) => void;
  onSwipeDelete?: (task: ScheduledTask) => void;
  scrollViewRef?: React.RefObject<ScrollView>;
  onScroll?: (event: any) => void;
}

// スワイプ削除可能なタスクブロック（モダンデザイン）
const SwipeableTaskBlock = React.memo(function SwipeableTaskBlock({
  task,
  taskY,
  taskHeight,
  onPress,
  onLongPress,
  onSwipeDelete,
}: {
  task: ScheduledTask;
  taskY: number;
  taskHeight: number;
  onPress: () => void;
  onLongPress: () => void;
  onSwipeDelete?: (task: ScheduledTask) => void;
}) {
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -120);
        deleteOpacity.value = Math.min(Math.abs(e.translationX) / 80, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationX < -80 && onSwipeDelete) {
        translateX.value = withTiming(-400, { duration: 200 });
        runOnJS(onSwipeDelete)(task);
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        deleteOpacity.value = withTiming(0, { duration: 150 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(onLongPress)();
    });

  const composedGesture = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteHintStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
  }));

  return (
    <View
      style={[
        styles.taskBlockWrapper,
        { top: taskY + 1, height: Math.max(taskHeight - 2, 32), left: 56, right: 12 },
      ]}
    >
      {/* 削除ヒント */}
      <Animated.View style={[styles.deleteHint, deleteHintStyle]}>
        <Text style={styles.deleteHintText}>🗑 削除</Text>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.taskBlock,
            { height: '100%' },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={[task.color, task.color + 'BB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.taskBlockGradient}
          >
            {/* 左ボーダーアクセント */}
            <View style={[styles.taskLeftBorder, { backgroundColor: task.color }]} />
            <View style={styles.taskContent}>
              <Text style={styles.taskIcon}>{task.icon}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskTime}>
                  {task.startTime} – {task.endTime}
                </Text>
              </View>
              {task.synced && (
                <View style={styles.syncBadge}>
                  <Text style={styles.syncBadgeText}>✓</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export const Timeline = React.memo(function Timeline({
  tasks,
  onTaskPress,
  onTaskLongPress,
  onTimeSlotPress,
  onSwipeDelete,
  scrollViewRef,
  onScroll,
}: Props) {
  const timeSlots = generateTimeSlots();
  const totalHeight = TIMELINE.HOUR_HEIGHT * (TIMELINE.END_HOUR - TIMELINE.START_HOUR);
  const internalRef = useRef<ScrollView>(null);
  const ref = scrollViewRef || internalRef;

  useEffect(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const yPos = minutesToYPosition(currentMinutes) - 150;
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: Math.max(0, yPos), animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowY = minutesToYPosition(nowMinutes);

  return (
    <ScrollView
      ref={ref as any}
      style={styles.container}
      contentContainerStyle={{ height: totalHeight }}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* タイムライン背景全体のタップ検出 */}
      <Pressable
        style={{ position: 'absolute', top: 0, left: 48, right: 0, height: totalHeight }}
        onPress={(e) => {
          const y = e.nativeEvent.locationY;
          const minutes = yPositionToMinutes(y);
          onTimeSlotPress(minutes);
        }}
      />

      {/* 時間ラベル + 線 */}
      {timeSlots.map(slot => {
        const y = minutesToYPosition(slot.hour * 60);
        return (
          <View
            key={slot.label}
            style={[styles.timeRow, { top: y }]}
            pointerEvents="none"
          >
            <Text style={styles.timeLabel}>{slot.label}</Text>
            <View style={styles.timeLine} />
          </View>
        );
      })}

      {/* 現在時刻インジケーター */}
      <View style={[styles.nowIndicator, { top: nowY }]}>
        <View style={styles.nowDot} />
        <View style={styles.nowLine} />
        <View style={styles.nowGlow} />
      </View>

      {/* 配置済みタスク */}
      {tasks.map(task => {
        const startMinutes = timeToMinutes(task.startTime);
        const taskY = minutesToYPosition(startMinutes);
        const taskHeight = (task.duration / 60) * TIMELINE.HOUR_HEIGHT;

        return (
          <SwipeableTaskBlock
            key={task.id}
            task={task}
            taskY={taskY}
            taskHeight={taskHeight}
            onPress={() => onTaskPress(task)}
            onLongPress={() => onTaskLongPress(task)}
            onSwipeDelete={onSwipeDelete}
          />
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.timelineBackground,
  },
  timeRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TIMELINE.HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeLabel: {
    width: 48,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'right',
    paddingRight: 8,
    marginTop: -7,
    fontVariant: ['tabular-nums'],
  },
  timeLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.timelineLine,
  },
  nowIndicator: {
    position: 'absolute',
    left: 40,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    zIndex: 2,
  },
  nowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.danger,
    zIndex: 2,
  },
  nowGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    top: -3,
    backgroundColor: COLORS.dangerGlow,
    zIndex: 1,
  },
  taskBlockWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 14,
    zIndex: 10,
  },
  deleteHint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    borderRadius: 14,
  },
  deleteHintText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  taskBlock: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  taskBlockGradient: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 0,
    borderRadius: 14,
    alignItems: 'center',
  },
  taskLeftBorder: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 10,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.75)',
    letterSpacing: 0.3,
  },
  taskTime: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.45)',
    marginTop: 1,
  },
  syncBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBadgeText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: 'bold',
  },
});
