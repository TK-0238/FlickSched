// 付箋カード — ドラッグ可能な付箋（タップ / 長押し / ドラッグ対応）
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../constants';
import type { TaskTemplate } from '../types';

interface Props {
  task: TaskTemplate;
  onTap: (task: TaskTemplate) => void;
  onLongPress: (task: TaskTemplate) => void;
  onDragStart?: (task: TaskTemplate) => void;
  onDragMove?: (task: TaskTemplate, absoluteY: number) => void;
  onDragEnd?: (task: TaskTemplate, absoluteY: number) => void;
}

export function StickyNote({ task, onTap, onLongPress, onDragStart, onDragMove, onDragEnd }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(1);
  const isDragging = useSharedValue(false);

  // タップジェスチャー
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onTap)(task);
    });

  // 長押しジェスチャー
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(onLongPress)(task);
    });

  // ドラッグジェスチャー（横スクロールと干渉しないように設定）
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.15, { damping: 10, stiffness: 200 });
      zIdx.value = 1000;
      if (onDragStart) runOnJS(onDragStart)(task);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      if (onDragMove) runOnJS(onDragMove)(task, e.absoluteY);
    })
    .onEnd((e) => {
      isDragging.value = false;
      // ドロップ完了 → 元の位置に戻す
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 12 });
      zIdx.value = 1;
      if (onDragEnd) runOnJS(onDragEnd)(task, e.absoluteY);
    })
    .onFinalize(() => {
      // キャンセル時もリセット
      if (isDragging.value) {
        isDragging.value = false;
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        scale.value = withSpring(1, { damping: 12 });
        zIdx.value = 1;
      }
    });

  // タップ→パン→長押しの優先度を設定
  const composedGesture = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIdx.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: task.color },
          animatedStyle,
        ]}
      >
        <Text style={styles.icon}>{task.icon}</Text>
        <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
        <Text style={styles.duration}>{task.duration}分</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: 90,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  duration: {
    fontSize: 10,
    color: 'rgba(26,26,46,0.6)',
    marginTop: 2,
  },
});
