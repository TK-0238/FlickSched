// 日付ナビゲーション — 上部の日付選択バー
import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { COLORS } from '../constants';
import { formatDateDisplay, getTodayString, getTomorrowString } from '../utils/time';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: Props) {
  const today = getTodayString();
  const tomorrow = getTomorrowString();

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === today;

  return (
    <View style={styles.container}>
      <Pressable onPress={goBack} style={styles.arrowBtn}>
        <Text style={styles.arrow}>◀</Text>
      </Pressable>

      <Pressable
        onPress={() => onDateChange(today)}
        style={styles.dateSection}
      >
        <Text style={styles.dateText}>
          📅 {formatDateDisplay(selectedDate)}
        </Text>
        {isToday && <Text style={styles.todayBadge}>今日</Text>}
        {selectedDate === tomorrow && <Text style={styles.tomorrowBadge}>明日</Text>}
      </Pressable>

      <Pressable onPress={goForward} style={styles.arrowBtn}>
        <Text style={styles.arrow}>▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  arrowBtn: {
    padding: 8,
  },
  arrow: {
    fontSize: 16,
    color: COLORS.primary,
  },
  dateSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  todayBadge: {
    fontSize: 11,
    color: COLORS.primary,
    backgroundColor: 'rgba(78,205,196,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tomorrowBadge: {
    fontSize: 11,
    color: COLORS.success,
    backgroundColor: 'rgba(130,224,170,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
