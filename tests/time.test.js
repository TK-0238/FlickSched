const {
  calcEndTime,
  findNextAvailableSlot,
  generateTimeSlots,
  hasConflict,
  minutesToTime,
  minutesToYPosition,
  timeToMinutes,
  yPositionToMinutes,
} = require('../src/utils/time');

describe('time utilities', () => {
  test('converts between HH:mm and minutes', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(timeToMinutes('invalid')).toBe(0);
  });

  test('wraps end time across midnight without losing duration semantics', () => {
    expect(calcEndTime('23:30', 60)).toBe('00:30');
    expect(calcEndTime('22:45', 180)).toBe('01:45');
  });

  test('converts and snaps timeline positions', () => {
    expect(minutesToYPosition(60)).toBe(80);
    expect(yPositionToMinutes(100)).toBe(90);
    expect(yPositionToMinutes(-100)).toBe(0);
    expect(yPositionToMinutes(99999)).toBe(1410);
  });

  test('detects overlaps but allows adjacent tasks', () => {
    const existing = [{
      id: 'a',
      templateId: 't',
      title: 'existing',
      date: '2099-01-01',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      color: '#fff',
      icon: 'x',
      synced: false,
    }];

    expect(hasConflict('09:30', 30, existing, '2099-01-01')?.id).toBe('a');
    expect(hasConflict('10:00', 30, existing, '2099-01-01')).toBeNull();
    expect(hasConflict('09:30', 30, existing, '2099-01-02')).toBeNull();
    expect(hasConflict('09:30', 30, existing, '2099-01-01', 'a')).toBeNull();
  });

  test('finds the next free slot from a preferred time', () => {
    const existing = [{
      id: 'a',
      templateId: 't',
      title: 'existing',
      date: '2099-01-01',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      color: '#fff',
      icon: 'x',
      synced: false,
    }];

    expect(findNextAvailableSlot('2099-01-01', 60, existing, '09:00')).toBe('10:00');
    expect(findNextAvailableSlot('2099-01-01', 30, [], '14:30')).toBe('14:30');
  });

  test('generates a complete 24-hour timeline', () => {
    const slots = generateTimeSlots();
    expect(slots).toHaveLength(24);
    expect(slots[0]).toEqual({ hour: 0, minute: 0, label: '00:00' });
    expect(slots[23]).toEqual({ hour: 23, minute: 0, label: '23:00' });
  });
});
