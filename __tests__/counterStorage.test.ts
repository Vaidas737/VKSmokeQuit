import AsyncStorage from '@react-native-async-storage/async-storage';

import {STORAGE_KEYS} from '@/constants/storage';
import {
  calculateMonthRemainingProgress,
  calculateWithdrawalBalances,
  deleteCounterWithdrawal,
  type CounterWithdrawalEntry,
  getStoredCounterWithdrawalHistory,
} from '@/utils/counterStorage';

describe('calculateMonthRemainingProgress', () => {
  it('returns full remaining progress at the start of the month', () => {
    const result = calculateMonthRemainingProgress(new Date(2026, 0, 1, 0, 0, 0, 0));

    expect(result.daysInMonth).toBe(31);
    expect(result.daysLeft).toBe(31);
    expect(result.remainingRatio).toBe(1);
  });

  it('returns the expected leap-year February values', () => {
    const result = calculateMonthRemainingProgress(
      new Date(2024, 1, 15, 12, 0, 0, 0),
    );

    expect(result.daysInMonth).toBe(29);
    expect(result.daysLeft).toBe(15);
    expect(result.remainingRatio).toBeGreaterThan(0);
    expect(result.remainingRatio).toBeLessThan(1);
  });

  it('approaches zero near the end of the month', () => {
    const result = calculateMonthRemainingProgress(
      new Date(2026, 0, 31, 23, 59, 59, 999),
    );

    expect(result.daysInMonth).toBe(31);
    expect(result.daysLeft).toBe(1);
    expect(result.remainingRatio).toBeGreaterThan(0);
    expect(result.remainingRatio).toBeLessThan(0.01);
  });
});

describe('calculateWithdrawalBalances', () => {
  it('excludes current month from past accumulated available amount', () => {
    const result = calculateWithdrawalBalances(
      new Date(2026, 0, 1),
      10,
      new Date(2026, 1, 15, 12, 0, 0, 0),
      [],
    );

    expect(result.generatedOverall).toBe(460);
    expect(result.generatedMonthly).toBe(150);
    expect(result.pastAccumulatedAvailable).toBe(310);
    expect(result.withdrawnTotal).toBe(0);
    expect(result.adjustedOverall).toBe(460);
  });

  it('decreases available and adjusted totals by valid withdrawals', () => {
    const withdrawals: CounterWithdrawalEntry[] = [
      {
        amount: 100,
        createdAtIso: '2026-02-14T10:00:00.000Z',
        id: 'withdraw-2',
      },
      {
        amount: 40,
        createdAtIso: '2026-01-20T10:00:00.000Z',
        id: 'withdraw-1',
      },
    ];

    const result = calculateWithdrawalBalances(
      new Date(2026, 0, 1),
      10,
      new Date(2026, 1, 15, 12, 0, 0, 0),
      withdrawals,
    );

    expect(result.withdrawnTotal).toBe(140);
    expect(result.pastAccumulatedAvailable).toBe(170);
    expect(result.adjustedOverall).toBe(320);
  });

  it('clamps adjusted and available amounts to zero when withdrawals exceed totals', () => {
    const withdrawals: CounterWithdrawalEntry[] = [
      {
        amount: 500,
        createdAtIso: '2026-02-02T10:00:00.000Z',
        id: 'withdraw-over',
      },
    ];

    const result = calculateWithdrawalBalances(
      new Date(2026, 0, 1),
      10,
      new Date(2026, 1, 2, 12, 0, 0, 0),
      withdrawals,
    );

    expect(result.generatedOverall).toBe(330);
    expect(result.withdrawnTotal).toBe(500);
    expect(result.pastAccumulatedAvailable).toBe(0);
    expect(result.adjustedOverall).toBe(0);
  });
});

describe('deleteCounterWithdrawal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('removes matching id and returns normalized newest-first history', async () => {
    const storedHistory: CounterWithdrawalEntry[] = [
      {
        amount: 20,
        createdAtIso: '2026-01-10T10:00:00.000Z',
        id: 'older',
      },
      {
        amount: 40,
        createdAtIso: '2026-03-10T10:00:00.000Z',
        id: 'newest',
      },
      {
        amount: 30,
        createdAtIso: '2026-02-10T10:00:00.000Z',
        id: 'delete-me',
      },
    ];

    await AsyncStorage.setItem(
      STORAGE_KEYS.counterWithdrawalHistory,
      JSON.stringify(storedHistory),
    );

    const updatedHistory = await deleteCounterWithdrawal('delete-me');

    expect(updatedHistory.map(entry => entry.id)).toEqual(['newest', 'older']);
  });

  it('returns unchanged history when id is missing', async () => {
    const storedHistory: CounterWithdrawalEntry[] = [
      {
        amount: 20,
        createdAtIso: '2026-01-10T10:00:00.000Z',
        id: 'entry-1',
      },
      {
        amount: 40,
        createdAtIso: '2026-03-10T10:00:00.000Z',
        id: 'entry-2',
      },
    ];

    await AsyncStorage.setItem(
      STORAGE_KEYS.counterWithdrawalHistory,
      JSON.stringify(storedHistory),
    );

    const updatedHistory = await deleteCounterWithdrawal('missing-id');
    const normalizedExistingHistory = await getStoredCounterWithdrawalHistory();

    expect(updatedHistory).toEqual(normalizedExistingHistory);
  });

  it('persists updated history after deletion', async () => {
    const storedHistory: CounterWithdrawalEntry[] = [
      {
        amount: 20,
        createdAtIso: '2026-01-10T10:00:00.000Z',
        id: 'entry-1',
      },
      {
        amount: 40,
        createdAtIso: '2026-03-10T10:00:00.000Z',
        id: 'entry-2',
      },
    ];

    await AsyncStorage.setItem(
      STORAGE_KEYS.counterWithdrawalHistory,
      JSON.stringify(storedHistory),
    );

    await deleteCounterWithdrawal('entry-1');

    const persistedRaw = await AsyncStorage.getItem(
      STORAGE_KEYS.counterWithdrawalHistory,
    );
    expect(persistedRaw).not.toBeNull();

    const persisted = JSON.parse(persistedRaw ?? '[]') as CounterWithdrawalEntry[];
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe('entry-2');
  });
});
