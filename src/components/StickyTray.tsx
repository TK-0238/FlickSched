// 付箋トレイ — 画面下部の付箋一覧（横スクロール、ドラッグ対応）
import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
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
        <Text style={styles.label}>📌 タスク付箋 ({tasks.length})</Text>
        <Pressable
          onPress={onAddNew}
          style={({ pressed }) => [
            styles.headerAddBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.headerAddBtnText}>＋ 新規作成</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        nestedScrollEnabled={true}
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
        {/* 末尾の追加ボタン */}
        <Pressable
          onPress={onAddNew}
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.addIcon}>＋</Text>
          <Text style={styles.addLabel}>付箋を作る</Text>
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
  headerAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  headerAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingRight: 30,
    alignItems: 'center',
  },
  addButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },
  addIcon: {
    fontSize: 28,
    color: COLORS.primary,
  },
  addLabel: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
});
