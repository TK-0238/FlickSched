// クイック予定追加モーダル — タイムラインタップで即入力
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, DURATION_OPTIONS, STICKY_COLORS } from '../constants';

interface Props {
  visible: boolean;
  startMinutes: number; // タップした時間（分）
  onClose: () => void;
  onSave: (data: {
    title: string;
    duration: number;
    startMinutes: number;
    color: string;
    icon: string;
    memo: string;
  }) => void;
}

// 分→時刻文字列
function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function QuickAddModal({ visible, startMinutes, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [color] = useState(() => STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]);
  const inputRef = useRef<TextInput>(null);

  // モーダル表示時にリセット
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDuration(60);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const endMinutes = startMinutes + duration;
  const endTimeStr = minutesToTimeStr(Math.min(endMinutes, 24 * 60));

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      duration,
      startMinutes,
      color,
      icon: '📌',
      memo: '',
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centerContainer}
        >
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.background]}
              style={styles.cardGradient}
            >
              {/* ヘッダー */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>📌 予定を追加</Text>
                <Text style={styles.timeLabel}>
                  {minutesToTimeStr(startMinutes)} 〜 {endTimeStr}
                </Text>
              </View>

              {/* タイトル入力 */}
              <TextInput
                ref={inputRef}
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="予定のタイトル"
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {/* 所要時間チップ */}
              <Text style={styles.sectionLabel}>所要時間</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map(d => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    style={[
                      styles.durationChip,
                      duration === d && styles.durationChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.durationText,
                      duration === d && styles.durationTextActive,
                    ]}>
                      {d >= 60 ? `${d / 60}時間` : `${d}分`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ボタン */}
              <View style={styles.buttonRow}>
                <Pressable onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>キャンセル</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
                  disabled={!title.trim()}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.saveBtnGradient}
                  >
                    <Text style={styles.saveText}>追加</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    padding: 24,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  titleInput: {
    fontSize: 18,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  durationTextActive: {
    color: COLORS.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
  },
});
