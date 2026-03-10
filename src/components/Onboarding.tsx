// 初回起動時オンボーディング — モダンデザイン
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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingProps {
  visible: boolean;
  onClose: () => void;
}

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
          <View style={styles.cardInner}>
            <Text style={styles.title}>⚡ フリスケ</Text>
            <Text style={styles.subtitle}>
              付箋をタップするだけで{'\n'}予定がサクッと決まる！
            </Text>

            <View style={styles.stepsContainer}>
              {STEPS.map((step, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.delay(index * 100 + 200)}
                  style={styles.stepRow}
                >
                  <LinearGradient
                    colors={[COLORS.primaryGlow, 'transparent']}
                    style={styles.emojiCircle}
                  >
                    <Text style={styles.emoji}>{step.emoji}</Text>
                  </LinearGradient>
                  <View style={styles.stepContent}>
                    <Text style={styles.actionText}>{step.action}</Text>
                    <Text style={styles.descText}>{step.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.startBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>はじめる 🚀</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  cardInner: {
    padding: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  stepsContainer: {
    width: '100%',
    gap: 14,
    marginBottom: 28,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  descText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startBtnGradient: {
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 16,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});
