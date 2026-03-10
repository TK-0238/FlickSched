// 付箋カード — モダンなデザインのドラッグ可能カード
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
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
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 12 });
      zIdx.value = 1;
      if (onDragEnd) runOnJS(onDragEnd)(task, e.absoluteY);
    })
    .onFinalize(() => {
      if (isDragging.value) {
        isDragging.value = false;
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        scale.value = withSpring(1, { damping: 12 });
        zIdx.value = 1;
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
