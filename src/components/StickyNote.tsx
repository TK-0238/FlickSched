// 付箋カード — スワイプ並び替え対応
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import type { TaskTemplate } from '../types';

interface Props {
  task: TaskTemplate;
  onTap: (task: TaskTemplate) => void;
  onLongPress: (task: TaskTemplate) => void;
  onDragStart?: (task: TaskTemplate) => void;
  onDragMove?: (task: TaskTemplate, absoluteY: number) => void;
  onDragEnd?: (task: TaskTemplate, absoluteY: number) => void;
  onSwapLeft?: (task: TaskTemplate) => void;
  onSwapRight?: (task: TaskTemplate) => void;
}

const SWAP_THRESHOLD = 45;
const DIRECTION_THRESHOLD = 12;

export function StickyNote({ task, onTap, onLongPress, onDragStart, onDragMove, onDragEnd, onSwapLeft, onSwapRight }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(1);
  const isDragging = useSharedValue(false);
  // ドラッグ方向: 0=未決定, 1=水平(並び替え), 2=垂直(タイムライン)
  const dragDirection = useSharedValue(0);
  const swapped = useSharedValue(false);

  const doHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

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

  // ドラッグジェスチャー（横=並び替え、縦=タイムライン配置）
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      isDragging.value = true;
      dragDirection.value = 0;
      swapped.value = false;
      scale.value = withSpring(1.12, { damping: 10, stiffness: 200 });
      zIdx.value = 1000;
    })
    .onUpdate((e) => {
      // 方向が未決定の場合、最初の動きで判定
      if (dragDirection.value === 0) {
        if (Math.abs(e.translationX) > DIRECTION_THRESHOLD || Math.abs(e.translationY) > DIRECTION_THRESHOLD) {
          dragDirection.value = Math.abs(e.translationX) > Math.abs(e.translationY) ? 1 : 2;
          if (dragDirection.value === 2 && onDragStart) {
            runOnJS(onDragStart)(task);
          }
        }
      }

      if (dragDirection.value === 1) {
        // 水平方向 = 並び替え
        translateX.value = e.translationX;
        // スワイプ閾値に達したら入れ替え
        if (!swapped.value && e.translationX > SWAP_THRESHOLD && onSwapRight) {
          swapped.value = true;
          runOnJS(doHaptic)();
          runOnJS(onSwapRight)(task);
        } else if (!swapped.value && e.translationX < -SWAP_THRESHOLD && onSwapLeft) {
          swapped.value = true;
          runOnJS(doHaptic)();
          runOnJS(onSwapLeft)(task);
        }
      } else if (dragDirection.value === 2) {
        // 垂直方向 = タイムラインへドラッグ
        translateX.value = e.translationX;
        translateY.value = e.translationY;
        if (onDragMove) runOnJS(onDragMove)(task, e.absoluteY);
      }
    })
    .onEnd((e) => {
      const dir = dragDirection.value;
      isDragging.value = false;
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 12 });
      zIdx.value = 1;
      dragDirection.value = 0;
      if (dir === 2 && onDragEnd) {
        runOnJS(onDragEnd)(task, e.absoluteY);
      }
    })
    .onFinalize(() => {
      if (isDragging.value) {
        isDragging.value = false;
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        scale.value = withSpring(1, { damping: 12 });
        zIdx.value = 1;
        dragDirection.value = 0;
      }
    });

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
      <Animated.View style={[styles.container, animatedStyle]}>
        <LinearGradient
          colors={[task.color, task.color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* 光沢エフェクト */}
          <View style={styles.sheen} />
          <Text style={styles.icon}>{task.icon}</Text>
          <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
          <View style={styles.durationBadge}>
            <Text style={styles.duration}>{task.duration}分</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 88,
    height: 96,
    borderRadius: 16,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 30,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.75)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  durationBadge: {
    marginTop: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 8,
  },
  duration: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
  },
});
