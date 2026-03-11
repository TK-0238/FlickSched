// 月カレンダーモーダル — 月一覧表示と日付選択（5〜6ヶ月先まで対応）
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  startOfMonth,
  getDaysInMonth,
  getDay,
  addMonths,
  format,
  isSameMonth,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { COLORS } from '../constants';
import type { ScheduledTask } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CALENDAR_PADDING = 12;
// コンテナの内側パディング(左右12)を差し引いたグリッド幅
const GRID_WIDTH = SCREEN_WIDTH - CALENDAR_PADDING * 2 - 24;
const DAY_CELL_SIZE = Math.floor(GRID_WIDTH / 7);

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS_BACK = 1;   // 先月まで遡れる
const MONTHS_AHEAD = 12; // 12ヶ月先（約1年）まで

// 月タブ1つあたりの幅（パディング含む）
const TAB_MIN_WIDTH = 52;
const TAB_GAP = 6;

interface Props {
  visible: boolean;
  selectedDate: string;
  scheduledTasks: ScheduledTask[];
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

export function MonthCalendar({
  visible,
  selectedDate,
  scheduledTasks,
  onSelectDate,
  onClose,
}: Props) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [viewingMonth, setViewingMonth] = useState<Date>(() =>
    startOfMonth(new Date(selectedDate))
  );
  const monthScrollRef = useRef<ScrollView>(null);

  // モーダル表示時に選択中日付の月へジャンプ
  useEffect(() => {
    if (visible) {
      const target = startOfMonth(new Date(selectedDate));
      setViewingMonth(target);
      setTimeout(() => scrollToMonthTab(target), 150);
    }
  }, [visible, selectedDate]);

  // ── 月タブ一覧（先月〜12ヶ月先） ──
  const monthTabs = useMemo(() => {
    const base = startOfMonth(now);
    const tabs: Date[] = [];
    for (let i = -MONTHS_BACK; i <= MONTHS_AHEAD; i++) {
      tabs.push(addMonths(base, i));
    }
    return tabs;
  }, []);

  // ── 日付→タスク数のマップ ──
  const taskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduledTasks.forEach(t => {
      map.set(t.date, (map.get(t.date) || 0) + 1);
    });
    return map;
  }, [scheduledTasks]);

  // ── 月ごとのイベント有無 ──
  const monthEventKeys = useMemo(() => {
    const set = new Set<string>();
    scheduledTasks.forEach(t => {
      const d = new Date(t.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    return set;
  }, [scheduledTasks]);

  // ── カレンダーグリッド（6行×7列に統一） ──
  const calendarRows = useMemo(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();
    const firstDow = getDay(startOfMonth(viewingMonth)); // 0=日曜
    const days = getDaysInMonth(viewingMonth);

    const cells: (Date | null)[] = [];
    // 月初より前の空白セル
    for (let i = 0; i < firstDow; i++) cells.push(null);
    // 当月の日付
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));

    // 7日ごとに行分割（常に6行にパディング）
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const row = cells.slice(i, i + 7);
      while (row.length < 7) row.push(null);
      rows.push(row);
    }
    while (rows.length < 6) {
      rows.push(Array(7).fill(null));
    }
    return rows;
  }, [viewingMonth]);

  // ── 月タブへのスクロール ──
  const scrollToMonthTab = (month: Date) => {
    const base = startOfMonth(now);
    let idx = MONTHS_BACK; // デフォルト=今月
    for (let i = -MONTHS_BACK; i <= MONTHS_AHEAD; i++) {
      const tab = addMonths(base, i);
      if (tab.getFullYear() === month.getFullYear() && tab.getMonth() === month.getMonth()) {
        idx = i + MONTHS_BACK;
        break;
      }
    }
    const itemW = TAB_MIN_WIDTH + TAB_GAP;
    const scrollX = Math.max(0, idx * itemW - SCREEN_WIDTH / 2 + itemW / 2);
    monthScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  };

  // ── 月ナビゲーション ──
  const canGoPrev = useMemo(() => {
    const min = addMonths(startOfMonth(now), -MONTHS_BACK);
    return addMonths(viewingMonth, -1) >= min;
  }, [viewingMonth]);

  const canGoNext = useMemo(() => {
    const max = addMonths(startOfMonth(now), MONTHS_AHEAD);
    return addMonths(viewingMonth, 1) <= max;
  }, [viewingMonth]);

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    const prev = addMonths(viewingMonth, -1);
    setViewingMonth(prev);
    scrollToMonthTab(prev);
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    const next = addMonths(viewingMonth, 1);
    setViewingMonth(next);
    scrollToMonthTab(next);
  };

  // ── 日付タップ ──
  const handleDayPress = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
    onClose();
  };

  // ── 今日に戻る ──
  const handleGoToToday = () => {
    onSelectDate(todayStr);
    onClose();
  };

  // ── ヘルパー ──
  const dateToStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        {/* 背景タップで閉じる */}
        <Pressable style={styles.overlayBg} onPress={onClose} />

        <View style={styles.container}>
          {/* ドラッグハンドル */}
          <View style={styles.handle} />

          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📅 カレンダー</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* 月ナビゲーション（← 2026年3月 →） */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={goToPrevMonth}
              style={[styles.monthArrow, !canGoPrev && styles.monthArrowDisabled]}
              disabled={!canGoPrev}
            >
              <Text style={[styles.monthArrowText, !canGoPrev && styles.monthArrowTextDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>
              {format(viewingMonth, 'yyyy年M月', { locale: ja })}
            </Text>
            <Pressable
              onPress={goToNextMonth}
              style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
              disabled={!canGoNext}
            >
              <Text style={[styles.monthArrowText, !canGoNext && styles.monthArrowTextDisabled]}>›</Text>
            </Pressable>
          </View>

          {/* 月タブ（横スクロール） */}
          <ScrollView
            ref={monthScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.monthTabScroll}
            contentContainerStyle={styles.monthTabContent}
          >
            {monthTabs.map((month, i) => {
              const isViewing = isSameMonth(month, viewingMonth);
              const isCurrent = isSameMonth(month, now);
              const key = `${month.getFullYear()}-${month.getMonth()}`;
              const hasEvents = monthEventKeys.has(key);

              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setViewingMonth(month);
                    scrollToMonthTab(month);
                  }}
                  style={[
                    styles.monthTab,
                    isViewing && styles.monthTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthTabText,
                      isViewing && styles.monthTabTextActive,
                      isCurrent && !isViewing && styles.monthTabTextCurrent,
                    ]}
                  >
                    {format(month, 'M月')}
                  </Text>
                  {/* 年が異なる場合は小さく年表示 */}
                  {month.getFullYear() !== now.getFullYear() && (
                    <Text style={[
                      styles.monthTabYear,
                      isViewing && styles.monthTabYearActive,
                    ]}>
                      {month.getFullYear()}
                    </Text>
                  )}
                  {hasEvents && (
                    <View
                      style={[
                        styles.monthEventDot,
                        isViewing && styles.monthEventDotActive,
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 曜日ヘッダー */}
          <View style={styles.weekHeader}>
            {WEEKDAYS.map((day, i) => (
              <View key={i} style={[styles.weekCell, { width: DAY_CELL_SIZE }]}>
                <Text
                  style={[
                    styles.weekText,
                    i === 0 && { color: '#FF5252' },
                    i === 6 && { color: '#4488FF' },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View style={styles.gridContainer}>
            {calendarRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((date, colIdx) => {
                  if (!date) {
                    return (
                      <View
                        key={`e-${rowIdx}-${colIdx}`}
                        style={[styles.dayCell, { width: DAY_CELL_SIZE, height: DAY_CELL_SIZE }]}
                      />
                    );
                  }

                  const ds = dateToStr(date);
                  const isSelected = ds === selectedDate;
                  const isToday = ds === todayStr;
                  const taskCount = taskCountMap.get(ds) || 0;
                  const dow = getDay(date);
                  const isPast =
                    date <
                    new Date(now.getFullYear(), now.getMonth(), now.getDate());

                  return (
                    <Pressable
                      key={ds}
                      onPress={() => handleDayPress(date)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        { width: DAY_CELL_SIZE, height: DAY_CELL_SIZE },
                        pressed && styles.dayCellPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isSelected && styles.dayCircleSelected,
                          isToday && !isSelected && styles.dayCircleToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                            isToday && !isSelected && styles.dayTextToday,
                            dow === 0 && !isSelected && { color: '#FF5252' },
                            dow === 6 && !isSelected && { color: '#4488FF' },
                            isPast &&
                              !isSelected &&
                              !isToday &&
                              styles.dayTextPast,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </View>
                      {/* タスクドット（最大3つ） */}
                      {taskCount > 0 && (
                        <View style={styles.dotRow}>
                          {Array.from({ length: Math.min(taskCount, 3) }).map(
                            (_, j) => (
                              <View
                                key={j}
                                style={[
                                  styles.dot,
                                  isSelected && styles.dotSelected,
                                ]}
                              />
                            )
                          )}
                          {taskCount > 3 && (
                            <Text
                              style={[
                                styles.dotMore,
                                isSelected && styles.dotMoreSelected,
                              ]}
                            >
                              +
                            </Text>
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* 今日に戻るボタン */}
          <Pressable
            onPress={handleGoToToday}
            style={({ pressed }) => [
              styles.todayBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.todayBtnGradient}
            >
              <Text style={styles.todayBtnText}>📍 今日に戻る</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ───── スタイル ─────
const styles = StyleSheet.create({
  // オーバーレイ
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // コンテナ（ボトムシート）
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },

  // ドラッグハンドル
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // 月ナビゲーション
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 14,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  monthArrowText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '300',
    marginTop: -2,
  },
  monthArrowTextDisabled: {
    color: COLORS.textMuted,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 120,
    textAlign: 'center',
  },

  // 月タブ
  monthTabScroll: {
    maxHeight: 48,
    marginHorizontal: 8,
  },
  monthTabContent: {
    gap: TAB_GAP,
    paddingHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 4,
  },
  monthTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    minWidth: TAB_MIN_WIDTH,
  },
  monthTabActive: {
    backgroundColor: COLORS.primary,
  },
  monthTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  monthTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthTabTextCurrent: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthTabYear: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: -1,
  },
  monthTabYearActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  monthEventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  monthEventDotActive: {
    backgroundColor: '#FFFFFF',
  },

  // 曜日ヘッダー
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginHorizontal: CALENDAR_PADDING,
  },
  weekCell: {
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },

  // カレンダーグリッド
  gridContainer: {
    paddingHorizontal: CALENDAR_PADDING,
    paddingVertical: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  dayCellPressed: {
    opacity: 0.5,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayTextPast: {
    color: COLORS.textMuted,
    opacity: 0.5,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    marginTop: 1,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  dotSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  dotMore: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 1,
  },
  dotMoreSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  // 今日に戻るボタン
  todayBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  todayBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  todayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
