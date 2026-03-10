// タイムライン — 0〜24時の縦スクロール + 配置済みタスク表示
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { COLORS, TIMELINE } from '../constants';
import { generateTimeSlots, minutesToYPosition, timeToMinutes } from '../utils/time';
import type { ScheduledTask } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  tasks: ScheduledTask[];
  onTaskPress: (task: ScheduledTask) => void;
  onTaskLongPress: (task: ScheduledTask) => void;
  onTimeSlotPress: (minutes: number) => void;
  scrollViewRef?: React.RefObject<ScrollView>;
}

export function Timeline({
  tasks,
  onTaskPress,
  onTaskLongPress,
  onTimeSlotPress,
  scrollViewRef,
}: Props) {
  const timeSlots = generateTimeSlots();
  const totalHeight = TIMELINE.HOUR_HEIGHT * (TIMELINE.END_HOUR - TIMELINE.START_HOUR);
  const internalRef = useRef<ScrollView>(null);
  const ref = scrollViewRef || internalRef;

  // 現在時刻付近にスクロール
  useEffect(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const yPos = minutesToYPosition(currentMinutes) - 150;
    setTimeout(() => {
      ref.current?.scrollTo({ y: Math.max(0, yPos), animated: true });
    }, 300);
  }, []);

  // 現在時刻のインジケーター位置
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowY = minutesToYPosition(nowMinutes);

  return (
    <ScrollView
      ref={ref as any}
      style={styles.container}
      contentContainerStyle={{ height: totalHeight }}
      showsVerticalScrollIndicator={true}
    >
      {/* 時間ラベル + 線 */}
      {timeSlots.map(slot => {
        const y = minutesToYPosition(slot.hour * 60);
        return (
          <Pressable
            key={slot.label}
            onPress={() => onTimeSlotPress(slot.hour * 60)}
            style={[styles.timeRow, { top: y }]}
          >
            <Text style={styles.timeLabel}>{slot.label}</Text>
            <View style={styles.timeLine} />
          </Pressable>
        );
      })}

      {/* 現在時刻インジケーター */}
      <View style={[styles.nowIndicator, { top: nowY }]}>
        <View style={styles.nowDot} />
        <View style={styles.nowLine} />
      </View>

      {/* 配置済みタスク（付箋） */}
      {tasks.map(task => {
        const startMinutes = timeToMinutes(task.startTime);
        const taskY = minutesToYPosition(startMinutes);
        const taskHeight = (task.duration / 60) * TIMELINE.HOUR_HEIGHT;

        return (
          <Pressable
            key={task.id}
            onPress={() => onTaskPress(task)}
            onLongPress={() => onTaskLongPress(task)}
            style={[
              styles.taskBlock,
              {
                top: taskY + 1,
                height: Math.max(taskHeight - 2, 28),
                backgroundColor: task.color,
                left: 60,
                right: 12,
              },
            ]}
          >
            <View style={styles.taskContent}>
              <Text style={styles.taskIcon}>{task.icon}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskTime}>
                  {task.startTime} - {task.endTime}
                </Text>
              </View>
              {task.synced && <Text style={styles.syncBadge}>✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

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
    width: 50,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    paddingRight: 8,
    marginTop: -7,
  },
  timeLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.timelineLine,
  },
  nowIndicator: {
    position: 'absolute',
    left: 44,
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
  },
  nowLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.danger,
  },
  taskBlock: {
    position: 'absolute',
    borderRadius: 10,
    padding: 8,
    // 付箋っぽい影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  taskTime: {
    fontSize: 11,
    color: 'rgba(26,26,46,0.6)',
    marginTop: 1,
  },
  syncBadge: {
    fontSize: 14,
    color: '#1a5e1a',
    fontWeight: 'bold',
  },
});
