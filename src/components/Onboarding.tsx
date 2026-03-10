// 初回起動時のオンボーディング画面 — 使い方ガイド
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingProps {
  visible: boolean;
  onClose: () => void;
}

// 使い方のステップ一覧
const STEPS = [
  {
    emoji: '👆',
    action: 'タップ',
    description: '付箋をタップすると空き時間に自動追加',
  },
  {
    emoji: '🖐️',
    action: '長押し+ドラッグ',
    description: '好きな時間にドラッグして配置',
  },
  {
    emoji: '✏️',
    action: '長押し',
    description: '付箋を長押しで編集モードに',
  },
  {
    emoji: '👈',
    action: '左スワイプ',
    description: 'タイムライン上の予定を左にスワイプで削除',
  },
  {
    emoji: '📅',
    action: '同期ボタン',
    description: 'ヘッダーの同期ボタンでカレンダーに一括登録',
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(120)}
          style={styles.card}
        >
          {/* ヘッダー */}
          <Text style={styles.title}>⚡ フリスケの使い方</Text>
          <Text style={styles.subtitle}>
            付箋をタップするだけで{'\n'}予定がサクッと決まる！
          </Text>

          {/* ステップ一覧 */}
          <View style={styles.stepsContainer}>
            {STEPS.map((step, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(index * 100 + 200)}
                style={styles.stepRow}
              >
                <View style={styles.emojiCircle}>
                  <Text style={styles.emoji}>{step.emoji}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.actionText}>{step.action}</Text>
                  <Text style={styles.descText}>{step.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* 開始ボタン */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.startBtn,
              pressed && styles.startBtnPressed,
            ]}
          >
            <Text style={styles.startBtnText}>はじめる 🚀</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    // シャドウ
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 28,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(78,205,196,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  stepContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  descText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 20,
  },
  startBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.background,
  },
});
