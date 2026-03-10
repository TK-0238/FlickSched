// 付箋トレイ — 画面下部（スワイプ並び替え対応）
import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
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
  onReorder?: (id: string, direction: 'left' | 'right') => void;
}

export function StickyTray({
  tasks,
  onTapTask,
  onLongPressTask,
  onAddNew,
  onDragStart,
  onDragMove,
  onDragEnd,
  onReorder,
}: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.border, 'transparent']}
        style={styles.topBorder}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>付箋</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{tasks.length}</Text>
          </View>
        </View>
        <Pressable
          onPress={onAddNew}
          style={({ pressed }) => [
            styles.headerAddBtn,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.headerAddBtnText}>＋ 新規作成</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
            onSwapLeft={onReorder ? (t) => onReorder(t.id, 'left') : undefined}
            onSwapRight={onReorder ? (t) => onReorder(t.id, 'right') : undefined}
          />
        ))}
        <Pressable
          onPress={onAddNew}
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primaryGlow, 'transparent']}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addLabel}>付箋を作る</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.trayBackground,
    paddingTop: 0,
    paddingBottom: 16,
  },
  topBorder: {
    height: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingRight: 30,
    paddingBottom: 4,
    alignItems: 'center',
  },
  addButton: {
    width: 88,
    height: 96,
    borderRadius: 16,
    marginHorizontal: 5,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  addIcon: {
    fontSize: 26,
    color: COLORS.primary,
  },
  addLabel: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
