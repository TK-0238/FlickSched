// フライアニメーション — 付箋がタイムラインに飛んでいくエフェクト
import React, { useEffect } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { COLORS, ANIMATION } from '../constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  color: string;
  icon: string;
  title: string;
  // 開始位置（付箋トレイ内の位置）
  fromX: number;
  fromY: number;
  // 終了位置（タイムライン上の位置）
  toX: number;
  toY: number;
  onComplete: () => void;
}

export function FlyAnimation({
  visible,
  color,
  icon,
  title,
  fromX,
  fromY,
  toX,
  toY,
  onComplete,
}: Props) {
  const translateX = useSharedValue(fromX);
  const translateY = useSharedValue(fromY);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // リセット
      translateX.value = fromX;
      translateY.value = fromY;
      scale.value = 1;
      opacity.value = 1;
      rotation.value = 0;

      // ポーンと飛ぶアニメーション
      translateX.value = withSpring(toX, {
        ...ANIMATION.SPRING_CONFIG,
        damping: 12,
      });
      translateY.value = withSpring(toY, {
        ...ANIMATION.SPRING_CONFIG,
        damping: 12,
      });
      scale.value = withSpring(0.8, ANIMATION.SPRING_CONFIG);
      rotation.value = withSpring(-5, { damping: 8, stiffness: 100 });

      // 完了コールバック
      opacity.value = withDelay(
        ANIMATION.FLY_DURATION,
        withTiming(0, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: color }, animatedStyle]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 4,
  },
});
