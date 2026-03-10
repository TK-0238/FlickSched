// タスクアクションモーダル — 配置済みタスクをタップした時のアクション選択
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
} from 'react-native';
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
          {/* タスク情報 */}
          <View style={[styles.header, { backgroundColor: task.color }]}>
            <Text style={styles.headerIcon}>{task.icon}</Text>
            <View>
              <Text style={styles.headerTitle}>{task.title}</Text>
              <Text style={styles.headerTime}>
                {task.startTime} - {task.endTime} ({task.duration}分)
              </Text>
            </View>
          </View>

          {/* アクションボタン */}
          <Pressable
            style={styles.actionBtn}
            onPress={() => { onSyncCalendar(task); onClose(); }}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>カレンダーに追加</Text>
              <Text style={styles.actionHint}>
                {task.synced ? '✓ 同期済み' : 'Apple / Google カレンダー'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.dangerAction]}
            onPress={() => { onRemove(task); onClose(); }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>予定から削除</Text>
          </Pressable>

          <Pressable style={styles.closeBtn} onPress={onClose}>
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
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  headerIcon: { fontSize: 32 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerTime: {
    fontSize: 13,
    color: 'rgba(26,26,46,0.7)',
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionInfo: {
    flex: 1,
  },
  actionIcon: { fontSize: 22 },
  actionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dangerAction: {
    // 削除ボタン用
  },
  closeBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
