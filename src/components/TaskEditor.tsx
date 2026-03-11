// タスク作成・編集モーダル — モダンデザイン
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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STICKY_COLORS, DURATION_OPTIONS } from '../constants';
import type { TaskTemplate } from '../types';

const EMOJI_LIST = [
  '💼', '🍱', '💪', '📚', '📧', '☕', '🏥', '🛒',
  '🎯', '💻', '🎵', '🚗', '✈️', '📞', '🎮', '🧹',
  '🍳', '🛏️', '🚿', '📝', '🏃', '🧘', '🎨', '🔧',
];

interface Props {
  visible: boolean;
  task?: TaskTemplate | null;
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
  const [customMode, setCustomMode] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [startHour, setStartHour] = useState(-1);
  const [startMinute, setStartMinute] = useState(0);
  const [memo, setMemo] = useState('');
  const [memoExpanded, setMemoExpanded] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDuration(task.duration);
      setColor(task.color);
      setIcon(task.icon);
      setDefaultStartTime(task.defaultStartTime || '');
      setMemo(task.memo || '');
      setMemoExpanded(!!(task.memo));
      // デフォルト開始時刻をパース
      if (task.defaultStartTime) {
        const [h, m] = task.defaultStartTime.split(':').map(Number);
        setStartHour(isNaN(h) ? -1 : h);
        setStartMinute(isNaN(m) ? 0 : m);
      } else {
        setStartHour(-1);
        setStartMinute(0);
      }
      // プリセットにない時間ならカスタムモードで表示
      const isPreset = DURATION_OPTIONS.includes(task.duration as any);
      setCustomMode(!isPreset);
      if (!isPreset) {
        setCustomHours(String(Math.floor(task.duration / 60) || ''));
        setCustomMinutes(String(task.duration % 60 || ''));
      } else {
        setCustomHours('');
        setCustomMinutes('');
      }
    } else {
      setTitle('');
      setDuration(60);
      setColor(STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]);
      setIcon('💼');
      setDefaultStartTime('');
      setStartHour(-1);
      setStartMinute(0);
      setCustomMode(false);
      setCustomHours('');
      setCustomMinutes('');
      setMemo('');
      setMemoExpanded(false);
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
      memo: memo.trim() || undefined,
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
          {/* ハンドルバー */}
          <View style={styles.handleBar} />

          <Text style={styles.modalTitle}>
            {task ? 'ルーティンを編集' : '新しいルーティン'}
          </Text>

          {/* プレビュー */}
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={[color, color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.preview}
            >
              <View style={styles.previewSheen} />
              <Text style={styles.previewIcon}>{icon}</Text>
              <Text style={styles.previewTitle}>{title || 'タスク名'}</Text>
              <View style={styles.previewDurationBadge}>
                <Text style={styles.previewDuration}>{duration}分</Text>
              </View>
            </LinearGradient>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
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
                  onPress={() => { setDuration(d); setCustomMode(false); }}
                  style={[
                    styles.durationBtn,
                    !customMode && duration === d && styles.durationBtnActive,
                  ]}
                >
                  <Text style={[
                    styles.durationText,
                    !customMode && duration === d && styles.durationTextActive,
                  ]}>
                    {d >= 60 ? `${d / 60}時間` : `${d}分`}
                  </Text>
                </Pressable>
              ))}
              {/* カスタム時間ボタン */}
              <Pressable
                onPress={() => setCustomMode(true)}
                style={[
                  styles.durationBtn,
                  customMode && styles.durationBtnActive,
                ]}
              >
                <Text style={[
                  styles.durationText,
                  customMode && styles.durationTextActive,
                ]}>
                  ✏️ 自由入力
                </Text>
              </Pressable>
            </View>
            {/* カスタム時間入力 */}
            {customMode && (
              <View style={styles.customDurationRow}>
                <View style={styles.customInputGroup}>
                  <TextInput
                    style={styles.customInput}
                    value={customHours}
                    onChangeText={(v) => {
                      const num = v.replace(/[^0-9]/g, '');
                      setCustomHours(num);
                      const h = parseInt(num || '0');
                      const m = parseInt(customMinutes || '0');
                      if (h > 0 || m > 0) setDuration(h * 60 + m);
                    }}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.customInputLabel}>時間</Text>
                </View>
                <View style={styles.customInputGroup}>
                  <TextInput
                    style={styles.customInput}
                    value={customMinutes}
                    onChangeText={(v) => {
                      const num = v.replace(/[^0-9]/g, '');
                      setCustomMinutes(num);
                      const h = parseInt(customHours || '0');
                      const m = parseInt(num || '0');
                      if (h > 0 || m > 0) setDuration(h * 60 + m);
                    }}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.customInputLabel}>分</Text>
                </View>
                <Text style={styles.customResult}>
                  → {duration > 0 ? `${Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}時間` : ''}${duration % 60 > 0 ? `${duration % 60}分` : ''}` : '---'}
                </Text>
              </View>
            )}

            {/* 色選択 */}
            <Text style={styles.sectionLabel}>ルーティンの色</Text>
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
                >
                  {color === c && <Text style={styles.colorCheck}>✓</Text>}
                </Pressable>
              ))}
            </View>

            {/* デフォルト開始時刻 */}
            <Text style={styles.sectionLabel}>デフォルト開始時刻（任意）</Text>
            <View style={styles.timePickerContainer}>
              {/* 設定なしボタン */}
              <Pressable
                onPress={() => { setDefaultStartTime(''); setStartHour(-1); setStartMinute(0); }}
                style={[
                  styles.timeNoneBtn,
                  startHour === -1 && styles.timeNoneBtnActive,
                ]}
              >
                <Text style={[
                  styles.timeNoneText,
                  startHour === -1 && styles.timeNoneTextActive,
                ]}>設定なし</Text>
              </Pressable>

              {startHour >= 0 && (
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeDisplayText}>
                    {String(startHour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}
                  </Text>
                </View>
              )}
            </View>

            {/* 時間選択 */}
            <Text style={styles.timeSubLabel}>時</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
              <View style={styles.timeRow}>
                {Array.from({ length: 24 }, (_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setStartHour(i);
                      const min = startMinute >= 0 ? startMinute : 0;
                      setDefaultStartTime(`${String(i).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
                    }}
                    style={[
                      styles.timeChip,
                      startHour === i && styles.timeChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.timeChipText,
                      startHour === i && styles.timeChipTextActive,
                    ]}>{i}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* 分選択 */}
            <Text style={styles.timeSubLabel}>分</Text>
            <View style={styles.timeRow}>
              {[0, 15, 30, 45].map(m => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setStartMinute(m);
                    const h = startHour >= 0 ? startHour : 9;
                    if (startHour < 0) setStartHour(h);
                    setDefaultStartTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                  }}
                  style={[
                    styles.timeChip,
                    styles.timeChipWide,
                    startMinute === m && startHour >= 0 && styles.timeChipActive,
                  ]}
                >
                  <Text style={[
                    styles.timeChipText,
                    startMinute === m && startHour >= 0 && styles.timeChipTextActive,
                  ]}>{String(m).padStart(2, '0')}</Text>
                </Pressable>
              ))}
            </View>

            {/* メモ欄（折りたたみ式） */}
            <View style={styles.memoSection}>
              {memoExpanded ? (
                <>
                  <Pressable
                    onPress={() => { if (!memo.trim()) setMemoExpanded(false); }}
                    style={styles.memoHeader}
                  >
                    <Text style={styles.sectionLabel}>📝 メモ</Text>
                    {!memo.trim() && (
                      <Text style={styles.memoCollapseText}>▲ 閉じる</Text>
                    )}
                  </Pressable>
                  <TextInput
                    style={styles.memoInput}
                    value={memo}
                    onChangeText={setMemo}
                    placeholder="メモを入力（任意）"
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    autoFocus
                  />
                </>
              ) : (
                <Pressable
                  onPress={() => setMemoExpanded(true)}
                  style={({ pressed }) => [
                    styles.memoToggleBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.memoToggleText}>📝 メモを追加</Text>
                </Pressable>
              )}
            </View>

          </ScrollView>

          {/* ボタン */}
          <View style={styles.buttonRow}>
            {task && onDelete && (
              <Pressable
                onPress={() => { onDelete(task.id); onClose(); }}
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.deleteBtnText}>削除</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                !title.trim() && { opacity: 0.4 },
                pressed && { opacity: 0.7 },
              ]}
              disabled={!title.trim()}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.saveBtnGradient}
              >
                <Text style={styles.saveBtnText}>保存</Text>
              </LinearGradient>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  previewContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  preview: {
    width: 100,
    height: 108,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewSheen: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewIcon: { fontSize: 32 },
  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.75)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  previewDurationBadge: {
    marginTop: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 8,
  },
  previewDuration: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 6,
  },
  emojiBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  emojiSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  emoji: { fontSize: 22 },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  durationTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  customDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  customInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
    width: 56,
    textAlign: 'center',
  },
  customInputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  customResult: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeNoneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeNoneBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeNoneText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timeNoneTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  timeDisplay: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  timeDisplayText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  timeSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  timeChip: {
    width: 38,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipWide: {
    width: 52,
  },
  timeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timeChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    transform: [{ scale: 1.15 }],
  },
  colorCheck: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.5)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24,
    marginBottom: 10,
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.dangerGlow,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    marginRight: 'auto',
  },
  deleteBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveBtnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 15 },
  memoSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoCollapseText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  memoToggleBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  memoToggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  memoInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    lineHeight: 22,
  },
});
