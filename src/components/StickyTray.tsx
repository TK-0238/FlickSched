// 付箋トレイ — 画面下部の付箋一覧（横スクロール、ドラッグ対応）
import React from 'react';
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { StickyNote } from './StickyNote';
import { COLORS } from '../constants';
import type { TaskTemplate } from '../types';

interface Props {
  tasks: TaskTemplate[];
  onTapTask: (task: TaskTemplate) => void;
  onLongPressTask: (task: TaskTemplate) => void;
  onAddNew: () => void;
  onDragStart?: (task: TaskTemplate) => void;
  onDragMove?: (task: TaskTemplate, absoluteY: number) => void;
  onDragEnd?: (task: TaskTemplate, absoluteY: number) => void;
}

export function StickyTray({
  tasks,
  onTapTask,
  onLongPressTask,
  onAddNew,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>📌 タスク付箋</Text>
        <Text style={styles.hint}>タップ or ドラッグで予定に追加</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tasks.map(task => (
          <StickyNote
            key={task.id}
            task={task}
            onTap={onTapTask}
            onLongPress={onLongPressTask}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}
        {/* 追加ボタン */}
        <Pressable
          onPress={onAddNew}
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.addIcon}>＋</Text>
          <Text style={styles.addLabel}>追加</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.trayBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  scrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  addButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  addIcon: {
    fontSize: 28,
    color: COLORS.textMuted,
  },
  addLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
