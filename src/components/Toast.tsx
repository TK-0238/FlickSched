// トースト通知 — 予定追加時の確認表示
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../constants';

interface Props {
  visible: boolean;
  message: string;
  type?: 'success' | 'info' | 'error';
  onHide: () => void;
}

export function Toast({ visible, message, type = 'success', onHide }: Props) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 200 });
      // 2秒後に非表示
      translateY.value = withDelay(2000, withSpring(-100));
      opacity.value = withDelay(2000, withTiming(0, { duration: 200 }));
      const timer = setTimeout(onHide, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, message, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const bgColor = type === 'success' ? COLORS.success
    : type === 'error' ? COLORS.danger
    : COLORS.primary;

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },
});
