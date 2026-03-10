// 付箋トレイ — 画面下部のモダンな付箋一覧（並び替えモード対応）
import React, { useState } from 'react';
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
  const [reorderMode, setReorderMode] = useState(false);

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
        <View style={styles.headerRight}>
          {/* 並び替えモード切り替え */}
          <Pressable
            onPress={() => setReorderMode(!reorderMode)}
            style={({ pressed }) => [
              styles.reorderBtn,
              reorderMode && styles.reorderBtnActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[
              styles.reorderBtnText,
              reorderMode && styles.reorderBtnTextActive,
            ]}>
              {reorderMode ? '✓ 完了' : '⇄ 並び替え'}
            </Text>
          </Pressable>
          {!reorderMode && (
            <Pressable
              onPress={onAddNew}
              style={({ pressed }) => [
                styles.headerAddBtn,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={styles.headerAddBtnText}>＋ 新規作成</Text>
            </Pressable>
          )}
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        nestedScrollEnabled={true}
      >
        {tasks.map((task, index) => (
          <View key={task.id} style={styles.noteWrapper}>
            {reorderMode ? (
              /* 並び替えモード：左右ボタン付き */
              <View style={styles.reorderItem}>
                <Pressable
                  onPress={() => onReorder?.(task.id, 'left')}
                  style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                  disabled={index === 0}
                >
                  <Text style={[styles.arrowText, index === 0 && styles.arrowTextDisabled]}>‹</Text>
                </Pressable>
                <View style={styles.reorderNoteContainer}>
                  <LinearGradient
                    colors={[task.color, task.color + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.reorderNote}
                  >
                    <Text style={styles.reorderIcon}>{task.icon}</Text>
                    <Text style={styles.reorderTitle} numberOfLines={1}>{task.title}</Text>
                  </LinearGradient>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{index + 1}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => onReorder?.(task.id, 'right')}
                  style={[styles.arrowBtn, index === tasks.length - 1 && styles.arrowBtnDisabled]}
                  disabled={index === tasks.length - 1}
                >
                  <Text style={[styles.arrowText, index === tasks.length - 1 && styles.arrowTextDisabled]}>›</Text>
                </Pressable>
              </View>
            ) : (
              /* 通常モード */
              <StickyNote
                task={task}
                onTap={onTapTask}
                onLongPress={onLongPressTask}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
              />
            )}
          </View>
        ))}
        {!reorderMode && (
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
        )}
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
  headerRight: {
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
  reorderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reorderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  reorderBtnTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  noteWrapper: {
    // ラッパー
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginHorizontal: 2,
  },
  arrowBtn: {
    width: 28,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  arrowBtnDisabled: {
    opacity: 0.25,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  arrowTextDisabled: {
    color: COLORS.textMuted,
  },
  reorderNoteContainer: {
    position: 'relative',
  },
  reorderNote: {
    width: 72,
    height: 80,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reorderIcon: {
    fontSize: 26,
  },
  reorderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },
  orderBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.trayBackground,
  },
  orderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.background,
  },
});
