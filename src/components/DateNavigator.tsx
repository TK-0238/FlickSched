// 日付ナビゲーション — モダンなスリムバー
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { formatDateDisplay, getTodayString, getTomorrowString } from '../utils/time';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenCalendar?: () => void;
}

export function DateNavigator({ selectedDate, onDateChange, onOpenCalendar }: Props) {
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

  const handleDatePress = () => {
    if (onOpenCalendar) {
      onOpenCalendar();
    } else {
      onDateChange(today);
    }
  };

  const isToday = selectedDate === today;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.surfaceLight, COLORS.surface]}
        style={styles.gradient}
      >
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.5}
          style={styles.arrowBtn}
        >
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDatePress}
          onLongPress={() => onDateChange(today)}
          activeOpacity={0.7}
          style={styles.dateSection}
        >
          <Text style={styles.dateText}>
            {formatDateDisplay(selectedDate)}
          </Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>今日</Text>
            </View>
          )}
          {selectedDate === tomorrow && (
            <View style={styles.tomorrowBadge}>
              <Text style={styles.tomorrowBadgeText}>明日</Text>
            </View>
          )}
          {/* カレンダーアイコン — タップで月カレンダーを開く */}
          {onOpenCalendar && (
            <Text style={styles.calendarIcon}>📅</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goForward}
          activeOpacity={0.5}
          style={styles.arrowBtn}
        >
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  arrowBtn: {
    padding: 8,
    paddingHorizontal: 14,
  },
  arrow: {
    fontSize: 28,
    fontWeight: '300',
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  todayBadge: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tomorrowBadge: {
    backgroundColor: COLORS.successGlow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  tomorrowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  calendarIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
});
