// タスク作成・編集モーダル
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, STICKY_COLORS, DURATION_OPTIONS } from '../constants';
import type { TaskTemplate } from '../types';

// よく使う絵文字リスト
const EMOJI_LIST = [
  '💼', '🍱', '💪', '📚', '📧', '☕', '🏥', '🛒',
  '🎯', '💻', '🎵', '🚗', '✈️', '📞', '🎮', '🧹',
  '🍳', '🛏️', '🚿', '📝', '🏃', '🧘', '🎨', '🔧',
];

interface Props {
  visible: boolean;
  task?: TaskTemplate | null;  // nullなら新規作成、あれば編集
  onSave: (task: Omit<TaskTemplate, 'id'>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function TaskEditor({ visible, task, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState(STICKY_COLORS[0]);
  const [icon, setIcon] = useState('💼');
  const [defaultStartTime, setDefaultStartTime] = useState('');

  // 編集時は既存値をセット
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDuration(task.duration);
      setColor(task.color);
      setIcon(task.icon);
      setDefaultStartTime(task.defaultStartTime || '');
    } else {
      setTitle('');
      setDuration(60);
      setColor(STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]);
      setIcon('💼');
      setDefaultStartTime('');
    }
  }, [task, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      duration,
      color,
      icon,
      defaultStartTime: defaultStartTime || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            {task ? '付箋を編集' : '新しい付箋'}
          </Text>

          {/* プレビュー */}
          <View style={[styles.preview, { backgroundColor: color }]}>
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={styles.previewTitle}>{title || 'タスク名'}</Text>
            <Text style={styles.previewDuration}>{duration}分</Text>
          </View>

          {/* タスク名 */}
          <Text style={styles.sectionLabel}>タスク名</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="例: 会議、ランチ、ジム..."
            placeholderTextColor={COLORS.textMuted}
            maxLength={20}
          />

          {/* アイコン選択 */}
          <Text style={styles.sectionLabel}>アイコン</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emojiRow}>
              {EMOJI_LIST.map(e => (
                <Pressable
                  key={e}
                  onPress={() => setIcon(e)}
                  style={[
                    styles.emojiBtn,
                    icon === e && styles.emojiSelected,
                  ]}
                >
                  <Text style={styles.emoji}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* 所要時間 */}
          <Text style={styles.sectionLabel}>所要時間</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map(d => (
              <Pressable
                key={d}
                onPress={() => setDuration(d)}
                style={[
                  styles.durationBtn,
                  duration === d && { backgroundColor: COLORS.primary },
                ]}
              >
                <Text style={[
                  styles.durationText,
                  duration === d && { color: '#1a1a2e' },
                ]}>
                  {d >= 60 ? `${d / 60}h` : `${d}m`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 色選択 */}
          <Text style={styles.sectionLabel}>付箋の色</Text>
          <View style={styles.colorRow}>
            {STICKY_COLORS.map(c => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorBtn,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
              />
            ))}
          </View>

          {/* デフォルト開始時刻 */}
          <Text style={styles.sectionLabel}>デフォルト開始時刻（任意）</Text>
          <TextInput
            style={styles.input}
            value={defaultStartTime}
            onChangeText={setDefaultStartTime}
            placeholder="例: 09:00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />

          {/* ボタン */}
          <View style={styles.buttonRow}>
            {task && onDelete && (
              <Pressable
                onPress={() => { onDelete(task.id); onClose(); }}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>削除</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, !title.trim() && { opacity: 0.5 }]}
              disabled={!title.trim()}
            >
              <Text style={styles.saveBtnText}>保存</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 14,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  previewIcon: { fontSize: 32 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginTop: 2 },
  previewDuration: { fontSize: 10, color: 'rgba(26,26,46,0.6)', marginTop: 1 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 4,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  emojiSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emoji: { fontSize: 22 },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    marginRight: 'auto',
  },
  deleteBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: { color: '#1a1a2e', fontWeight: '700', fontSize: 15 },
});
