// 付箋カード — トレイに表示される各タスクの付箋
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS } from '../constants';
import type { TaskTemplate } from '../types';

interface Props {
  task: TaskTemplate;
  onTap: (task: TaskTemplate) => void;
  onLongPress: (task: TaskTemplate) => void;
}

export function StickyNote({ task, onTap, onLongPress }: Props) {
  return (
    <Pressable
      onPress={() => onTap(task)}
      onLongPress={() => onLongPress(task)}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: task.color },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{task.icon}</Text>
      <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
      <Text style={styles.duration}>{task.duration}分</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: 90,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    // 付箋っぽい影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.8,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  duration: {
    fontSize: 10,
    color: 'rgba(26,26,46,0.6)',
    marginTop: 2,
  },
});
