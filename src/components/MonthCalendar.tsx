// 月カレンダーモーダル — 年間月グリッド + 日付選択（無制限の未来日付、年ピッカー対応）
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
const GRID_WIDTH = SCREEN_WIDTH - CALENDAR_PADDING * 2 - 24;
const DAY_CELL_SIZE = Math.floor(GRID_WIDTH / 7);

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
// 過去方向は固定（2年）、未来方向は動的拡張
const MONTHS_BACK = 24;
const INITIAL_MONTHS_AHEAD = 36;
const EXTEND_THRESHOLD = 6;
const EXTEND_AMOUNT = 24;

// 月タブ
const TAB_MIN_WIDTH = 52;
const TAB_GAP = 6;

// 年ピッカーの月グリッド設定（4×3）
const MONTH_GRID_COLS = 4;
const MONTH_GRID_GAP = 8;
const MONTH_CELL_WIDTH = Math.floor((SCREEN_WIDTH - 48 - MONTH_GRID_GAP * (MONTH_GRID_COLS - 1)) / MONTH_GRID_COLS);
const MONTH_CELL_HEIGHT = 72;

// 年ピッカーで移動可能な年範囲
const MIN_YEAR_OFFSET = -5;  // 現在から5年前まで
const MAX_YEAR_OFFSET = 10;  // 現在から10年先まで

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

  // ── ビューモード: 'calendar'=日付グリッド, 'yearPicker'=年間月グリッド ──
  const [viewMode, setViewMode] = useState<'calendar' | 'yearPicker'>('calendar');
  const [viewingMonth, setViewingMonth] = useState<Date>(() =>
    startOfMonth(new Date(selectedDate))
  );
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const monthScrollRef = useRef<ScrollView>(null);
  const [monthsAhead, setMonthsAhead] = useState(INITIAL_MONTHS_AHEAD);

  // モーダル表示時に選択中日付の月へジャンプ
  useEffect(() => {
    if (visible) {
      const target = startOfMonth(new Date(selectedDate));
      setViewingMonth(target);
      setViewMode('calendar');
      setTimeout(() => scrollToMonthTab(target), 150);
    }
  }, [visible, selectedDate]);

  // ── 月タブ一覧（動的拡張） ──
  const monthTabs = useMemo(() => {
    const base = startOfMonth(now);
    const tabs: Date[] = [];
    for (let i = -MONTHS_BACK; i <= monthsAhead; i++) {
      tabs.push(addMonths(base, i));
    }
    return tabs;
  }, [monthsAhead]);

  // ── 日付→タスク数マップ ──
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

  // ── 月ごとのタスク数マップ（年ピッカー用） ──
  const monthTaskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduledTasks.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [scheduledTasks]);

  // ── 自動拡張（表示月が境界に近づいたら） ──
  useEffect(() => {
    const base = startOfMonth(now);
    const diff = (viewingMonth.getFullYear() - base.getFullYear()) * 12
      + (viewingMonth.getMonth() - base.getMonth());
    if (diff > monthsAhead - EXTEND_THRESHOLD) {
      setMonthsAhead(prev => Math.max(prev, diff + EXTEND_AMOUNT));
    }
  }, [viewingMonth, monthsAhead]);

  // ── カレンダーグリッド（6行×7列） ──
  const calendarRows = useMemo(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();
    const firstDow = getDay(startOfMonth(viewingMonth));
    const days = getDaysInMonth(viewingMonth);

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));

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

  // ── 月タブスクロール（O(1)） ──
  const scrollToMonthTab = useCallback((month: Date) => {
    const base = startOfMonth(now);
    const diff = (month.getFullYear() - base.getFullYear()) * 12
      + (month.getMonth() - base.getMonth());
    const idx = diff + MONTHS_BACK;
    const itemW = TAB_MIN_WIDTH + TAB_GAP;
    const scrollX = Math.max(0, idx * itemW - SCREEN_WIDTH / 2 + itemW / 2);
    monthScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }, []);

  // ── 月ナビ ──
  const canGoPrev = useMemo(() => {
    const min = addMonths(startOfMonth(now), -MONTHS_BACK);
    return addMonths(viewingMonth, -1) >= min;
  }, [viewingMonth]);

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    const prev = addMonths(viewingMonth, -1);
    setViewingMonth(prev);
    scrollToMonthTab(prev);
  };

  const goToNextMonth = () => {
    const next = addMonths(viewingMonth, 1);
    setViewingMonth(next);
    scrollToMonthTab(next);
  };

  // ── 月タイトルタップ → 年ピッカーモードへ切替 ──
  const handleMonthTitlePress = () => {
    if (viewMode === 'calendar') {
      setPickerYear(viewingMonth.getFullYear());
      setViewMode('yearPicker');
    } else {
      setViewMode('calendar');
    }
  };

  // ── 年ピッカーで月を選択 ──
  const handlePickerMonthSelect = (monthIndex: number) => {
    const target = new Date(pickerYear, monthIndex, 1);
    setViewingMonth(target);
    setViewMode('calendar');
    // 自動拡張が必要ならトリガー
    const base = startOfMonth(now);
    const diff = (pickerYear - base.getFullYear()) * 12
      + (monthIndex - base.getMonth());
    if (diff > monthsAhead - EXTEND_THRESHOLD) {
      setMonthsAhead(prev => Math.max(prev, diff + EXTEND_AMOUNT));
    }
    setTimeout(() => scrollToMonthTab(target), 150);
  };

  // ── 年ピッカーの年ナビ ──
  const canPickerPrevYear = pickerYear > now.getFullYear() + MIN_YEAR_OFFSET;
  const canPickerNextYear = pickerYear < now.getFullYear() + MAX_YEAR_OFFSET;

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
    if (viewMode === 'yearPicker') {
      setViewMode('calendar');
    }
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

  // ── 年ピッカー: 月グリッドのレンダリング ──
  const renderYearPicker = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const rows: number[][] = [];
    for (let i = 0; i < 12; i += MONTH_GRID_COLS) {
      rows.push(months.slice(i, i + MONTH_GRID_COLS));
    }

    return (
      <View style={styles.yearPickerContainer}>
        {/* 年ナビゲーション */}
        <View style={styles.yearNav}>
          <Pressable
            onPress={() => canPickerPrevYear && setPickerYear(y => y - 1)}
            style={[styles.yearArrow, !canPickerPrevYear && styles.yearArrowDisabled]}
            disabled={!canPickerPrevYear}
          >
            <Text style={[styles.yearArrowText, !canPickerPrevYear && styles.yearArrowTextDisabled]}>‹</Text>
          </Pressable>
          <Text style={styles.yearTitle}>{pickerYear}年</Text>
          <Pressable
            onPress={() => canPickerNextYear && setPickerYear(y => y + 1)}
            style={[styles.yearArrow, !canPickerNextYear && styles.yearArrowDisabled]}
            disabled={!canPickerNextYear}
          >
            <Text style={[styles.yearArrowText, !canPickerNextYear && styles.yearArrowTextDisabled]}>›</Text>
          </Pressable>
        </View>

        {/* 月グリッド（4×3） */}
        <View style={styles.monthGrid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.monthGridRow}>
              {row.map(monthIdx => {
                const isCurrentMonth = pickerYear === now.getFullYear() && monthIdx === now.getMonth();
                const isViewingMonth = pickerYear === viewingMonth.getFullYear() && monthIdx === viewingMonth.getMonth();
                const isPastMonth = new Date(pickerYear, monthIdx, 1) < startOfMonth(now);
                const key = `${pickerYear}-${monthIdx}`;
                const hasEvents = monthEventKeys.has(key);
                const taskCount = monthTaskCountMap.get(key) || 0;

                return (
                  <Pressable
                    key={monthIdx}
                    onPress={() => handlePickerMonthSelect(monthIdx)}
                    style={({ pressed }) => [
                      styles.monthCell,
                      isViewingMonth && styles.monthCellSelected,
                      isCurrentMonth && !isViewingMonth && styles.monthCellCurrent,
                      pressed && styles.monthCellPressed,
                    ]}
                  >
                    <Text style={[
                      styles.monthCellText,
                      isViewingMonth && styles.monthCellTextSelected,
                      isCurrentMonth && !isViewingMonth && styles.monthCellTextCurrent,
                      isPastMonth && !isCurrentMonth && !isViewingMonth && styles.monthCellTextPast,
                    ]}>
                      {monthIdx + 1}月
                    </Text>
                    {/* イベントインジケーター */}
                    {hasEvents && (
                      <View style={styles.monthCellIndicator}>
                        <View style={[
                          styles.monthCellDot,
                          isViewingMonth && styles.monthCellDotSelected,
                        ]} />
                        {taskCount > 1 && (
                          <Text style={[
                            styles.monthCellCount,
                            isViewingMonth && styles.monthCellCountSelected,
                          ]}>
                            {taskCount}
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

        {/* 年ジャンプショートカット */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearShortcutsContent}
          style={styles.yearShortcuts}
        >
          {Array.from({ length: MAX_YEAR_OFFSET - MIN_YEAR_OFFSET + 1 }, (_, i) => {
            const year = now.getFullYear() + MIN_YEAR_OFFSET + i;
            const isActive = year === pickerYear;
            const isCurrent = year === now.getFullYear();
            return (
              <Pressable
                key={year}
                onPress={() => setPickerYear(year)}
                style={[
                  styles.yearChip,
                  isActive && styles.yearChipActive,
                  isCurrent && !isActive && styles.yearChipCurrent,
                ]}
              >
                <Text style={[
                  styles.yearChipText,
                  isActive && styles.yearChipTextActive,
                  isCurrent && !isActive && styles.yearChipTextCurrent,
                ]}>
                  {year}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayBg} onPress={onClose} />

        <View style={styles.container}>
          <View style={styles.handle} />

          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📅 カレンダー</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* 月ナビゲーション — タイトルタップで年ピッカーへ */}
          <View style={styles.monthNav}>
            {viewMode === 'calendar' ? (
              <>
                <Pressable
                  onPress={goToPrevMonth}
                  style={[styles.monthArrow, !canGoPrev && styles.monthArrowDisabled]}
                  disabled={!canGoPrev}
                >
                  <Text style={[styles.monthArrowText, !canGoPrev && styles.monthArrowTextDisabled]}>‹</Text>
                </Pressable>
                <Pressable onPress={handleMonthTitlePress} style={styles.monthTitleBtn}>
                  <Text style={styles.monthTitle}>
                    {format(viewingMonth, 'yyyy年M月', { locale: ja })}
                  </Text>
                  <Text style={styles.monthTitleArrow}>▼</Text>
                </Pressable>
                <Pressable onPress={goToNextMonth} style={styles.monthArrow}>
                  <Text style={styles.monthArrowText}>›</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={handleMonthTitlePress} style={styles.monthTitleBtn}>
                <Text style={styles.monthTitle}>
                  {format(viewingMonth, 'yyyy年M月', { locale: ja })}
                </Text>
                <Text style={styles.monthTitleArrow}>▲</Text>
              </Pressable>
            )}
          </View>

          {viewMode === 'yearPicker' ? (
            // ── 年ピッカーモード: 月グリッド ──
            renderYearPicker()
          ) : (
            // ── カレンダーモード: 日付グリッド ──
            <>
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
                        date < new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
                                isPast && !isSelected && !isToday && styles.dayTextPast,
                              ]}
                            >
                              {date.getDate()}
                            </Text>
                          </View>
                          {taskCount > 0 && (
                            <View style={styles.dotRow}>
                              {Array.from({ length: Math.min(taskCount, 3) }).map((_, j) => (
                                <View
                                  key={j}
                                  style={[styles.dot, isSelected && styles.dotSelected]}
                                />
                              ))}
                              {taskCount > 3 && (
                                <Text style={[styles.dotMore, isSelected && styles.dotMoreSelected]}>+</Text>
                              )}
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}

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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
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
  // 月タイトル（タップ可能、▼付き）
  monthTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  monthTitleArrow: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ── 年ピッカー ──
  yearPickerContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 20,
  },
  yearArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearArrowDisabled: {
    opacity: 0.3,
  },
  yearArrowText: {
    fontSize: 26,
    color: COLORS.primary,
    fontWeight: '300',
    marginTop: -2,
  },
  yearArrowTextDisabled: {
    color: COLORS.textMuted,
  },
  yearTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    minWidth: 80,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // 月グリッド（4×3）
  monthGrid: {
    gap: MONTH_GRID_GAP,
    paddingVertical: 8,
  },
  monthGridRow: {
    flexDirection: 'row',
    gap: MONTH_GRID_GAP,
    justifyContent: 'center',
  },
  monthCell: {
    width: MONTH_CELL_WIDTH,
    height: MONTH_CELL_HEIGHT,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  monthCellSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  monthCellCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  monthCellPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  monthCellText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  monthCellTextSelected: {
    color: '#FFFFFF',
  },
  monthCellTextCurrent: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  monthCellTextPast: {
    color: COLORS.textMuted,
    opacity: 0.6,
  },
  monthCellIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  monthCellDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  monthCellDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  monthCellCount: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  monthCellCountSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  // 年ジャンプショートカット
  yearShortcuts: {
    marginTop: 4,
    maxHeight: 38,
  },
  yearShortcutsContent: {
    gap: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  yearChipActive: {
    backgroundColor: COLORS.primary,
  },
  yearChipCurrent: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  yearChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  yearChipTextCurrent: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── 月タブ（横スクロール） ──
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

  // ── 曜日ヘッダー ──
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

  // ── カレンダーグリッド ──
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

  // ── 今日に戻るボタン ──
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
