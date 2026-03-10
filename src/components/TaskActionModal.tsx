// タスクアクションモーダル — モダンなカードスタイルのアクション選択
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import type { ScheduledTask } from '../types';

interface Props {
  visible: boolean;
  task: ScheduledTask | null;
  onSyncCalendar: (task: ScheduledTask) => void;
  onRemove: (task: ScheduledTask) => void;
  onClose: () => void;
}

export function TaskActionModal({
  visible,
  task,
  onSyncCalendar,
  onRemove,
  onClose,
}: Props) {
  if (!task) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal}>
          {/* タスクヘッダー */}
          <LinearGradient
            colors={[task.color, task.color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerSheen} />
            <Text style={styles.headerIcon}>{task.icon}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{task.title}</Text>
              <Text style={styles.headerTime}>
                {task.startTime} – {task.endTime}（{task.duration}分）
              </Text>
              {task.memo ? (
                <Text style={styles.headerMemo}>📝 {task.memo}</Text>
              ) : null}
            </View>
          </LinearGradient>

          {/* アクションボタン */}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { backgroundColor: COLORS.surfaceLight }]}
            onPress={() => { onSyncCalendar(task); onClose(); }}
          >
            <View style={styles.actionIconWrap}>
              <Text style={styles.actionIcon}>📅</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>カレンダーに追加</Text>
              <Text style={styles.actionHint}>
                {task.synced ? '✓ 同期済み' : 'Apple / Googleカレンダーに追加'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { backgroundColor: COLORS.dangerGlow },
            ]}
            onPress={() => { onRemove(task); onClose(); }}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: COLORS.dangerGlow }]}>
              <Text style={styles.actionIcon}>🗑️</Text>
            </View>
            <Text style={[styles.actionText, { color: COLORS.danger }]}>予定から削除</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>閉じる</Text>
          </Pressable>
        </View>
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
    padding: 30,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
  },
  headerSheen: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerIcon: { fontSize: 36 },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.75)',
    letterSpacing: 0.3,
  },
  headerTime: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  headerMemo: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.45)',
    marginTop: 4,
    lineHeight: 17,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionIcon: { fontSize: 20 },
  actionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
