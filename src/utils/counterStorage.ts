import AsyncStorage from '@react-native-async-storage/async-storage';

import {STORAGE_KEYS} from '@/constants/storage';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_DAILY_AMOUNT = 45;

type CounterSettings = {
  dailyAmount: number;
  startDate: Date;
};

export type CounterWithdrawalEntry = {
  amount: number;
  createdAtIso: string;
  id: string;
};

export type MonthRemainingProgress = {
  daysInMonth: number;
  daysLeft: number;
  remainingRatio: number;
};

type CounterWithdrawalBalances = {
  adjustedOverall: number;
  generatedMonthly: number;
  generatedOverall: number;
  pastAccumulatedAvailable: number;
  withdrawnTotal: number;
};

function normalizeDailyAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    return DEFAULT_DAILY_AMOUNT;
  }

  return Math.floor(amount);
}

function parseStoredDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return startOfLocalDay(parsed);
}

function parseStoredDailyAmount(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

function isValidIsoDate(value: string): boolean {
  const parsed = new Date(value);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function compareNewestFirst(
  left: CounterWithdrawalEntry,
  right: CounterWithdrawalEntry,
): number {
  const rightTime = new Date(right.createdAtIso).getTime();
  const leftTime = new Date(left.createdAtIso).getTime();

  return rightTime - leftTime;
}

function normalizeStoredWithdrawalHistory(
  value: string | null,
): {history: CounterWithdrawalEntry[]; isNormalized: boolean} {
  if (!value) {
    return {history: [], isNormalized: false};
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return {history: [], isNormalized: true};
    }

    const normalized = parsed
      .map((candidate): CounterWithdrawalEntry | null => {
        if (!candidate || typeof candidate !== 'object') {
          return null;
        }

        const {amount, createdAtIso, id} = candidate as {
          amount?: unknown;
          createdAtIso?: unknown;
          id?: unknown;
        };

        if (
          typeof amount !== 'number' ||
          !Number.isFinite(amount) ||
          !Number.isInteger(amount) ||
          amount <= 0
        ) {
          return null;
        }

        if (typeof createdAtIso !== 'string' || !isValidIsoDate(createdAtIso)) {
          return null;
        }

        if (typeof id !== 'string' || id.trim().length === 0) {
          return null;
        }

        return {
          amount,
          createdAtIso,
          id,
        };
      })
      .filter((entry): entry is CounterWithdrawalEntry => Boolean(entry))
      .sort(compareNewestFirst);

    const isNormalized = JSON.stringify(normalized) !== JSON.stringify(parsed);

    return {
      history: normalized,
      isNormalized,
    };
  } catch {
    return {history: [], isNormalized: true};
  }
}

function normalizeWithdrawalHistoryEntries(
  history: CounterWithdrawalEntry[],
): CounterWithdrawalEntry[] {
  return history
    .filter(
      entry =>
        Number.isFinite(entry.amount) &&
        Number.isInteger(entry.amount) &&
        entry.amount > 0 &&
        typeof entry.id === 'string' &&
        entry.id.trim().length > 0 &&
        typeof entry.createdAtIso === 'string' &&
        isValidIsoDate(entry.createdAtIso),
    )
    .sort(compareNewestFirst);
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function localDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLIS_PER_DAY,
  );
}

function inclusiveDaysBetween(startDate: Date, endDate: Date): number {
  if (startDate.getTime() > endDate.getTime()) {
    return 0;
  }

  return localDayNumber(endDate) - localDayNumber(startDate) + 1;
}

export function calculateCounterTotals(
  startDate: Date,
  dailyAmount: number,
  now: Date,
): {monthly: number; overall: number} {
  const today = startOfLocalDay(now);
  const normalizedStartDate = startOfLocalDay(startDate);
  const normalizedDailyAmount = normalizeDailyAmount(dailyAmount);

  if (normalizedStartDate.getTime() > today.getTime()) {
    return {monthly: 0, overall: 0};
  }

  const overallDays = inclusiveDaysBetween(normalizedStartDate, today);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartDate =
    normalizedStartDate.getTime() > firstDayOfMonth.getTime()
      ? normalizedStartDate
      : firstDayOfMonth;
  const monthlyDays = inclusiveDaysBetween(monthStartDate, today);

  return {
    monthly: monthlyDays * normalizedDailyAmount,
    overall: overallDays * normalizedDailyAmount,
  };
}

export function calculateWithdrawalBalances(
  startDate: Date,
  dailyAmount: number,
  now: Date,
  withdrawals: CounterWithdrawalEntry[],
): CounterWithdrawalBalances {
  const totals = calculateCounterTotals(startDate, dailyAmount, now);
  const normalizedWithdrawals = normalizeWithdrawalHistoryEntries(withdrawals);
  const pastGenerated = Math.max(0, totals.overall - totals.monthly);
  const withdrawnTotal = normalizedWithdrawals.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  return {
    adjustedOverall: Math.max(0, totals.overall - withdrawnTotal),
    generatedMonthly: totals.monthly,
    generatedOverall: totals.overall,
    pastAccumulatedAvailable: Math.max(0, pastGenerated - withdrawnTotal),
    withdrawnTotal,
  };
}

export function calculateMonthRemainingProgress(now: Date): MonthRemainingProgress {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const totalDurationMs = nextMonthStart.getTime() - monthStart.getTime();
  const remainingDurationMs = Math.max(0, nextMonthStart.getTime() - now.getTime());
  const remainingRatio =
    totalDurationMs <= 0
      ? 0
      : Math.min(1, Math.max(0, remainingDurationMs / totalDurationMs));
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(
    0,
    localDayNumber(nextMonthStart) - localDayNumber(startOfLocalDay(now)),
  );

  return {
    daysInMonth,
    daysLeft,
    remainingRatio,
  };
}

export async function getStoredCounterSettings(): Promise<CounterSettings> {
  const today = startOfLocalDay(new Date());

  try {
    const [storedStartDate, storedDailyAmount] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.counterStartDate),
      AsyncStorage.getItem(STORAGE_KEYS.counterDailyAmount),
    ]);

    const parsedStartDate = parseStoredDate(storedStartDate);
    const parsedDailyAmount = parseStoredDailyAmount(storedDailyAmount);
    const startDate = parsedStartDate ?? today;
    const dailyAmount = parsedDailyAmount ?? DEFAULT_DAILY_AMOUNT;

    if (!parsedStartDate || parsedDailyAmount === null) {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.counterStartDate, startDate.toISOString()),
        AsyncStorage.setItem(STORAGE_KEYS.counterDailyAmount, String(dailyAmount)),
      ]);
    }

    return {dailyAmount, startDate};
  } catch {
    return {dailyAmount: DEFAULT_DAILY_AMOUNT, startDate: today};
  }
}

export async function saveCounterDailyAmount(amount: number): Promise<number> {
  const normalizedAmount = normalizeDailyAmount(amount);
  await AsyncStorage.setItem(
    STORAGE_KEYS.counterDailyAmount,
    String(normalizedAmount),
  );

  return normalizedAmount;
}

export async function saveCounterStartDate(date: Date): Promise<Date> {
  const normalizedDate = startOfLocalDay(date);
  await AsyncStorage.setItem(
    STORAGE_KEYS.counterStartDate,
    normalizedDate.toISOString(),
  );

  return normalizedDate;
}

export async function resetCounterStartDate(): Promise<Date> {
  return saveCounterStartDate(new Date());
}

export async function getStoredCounterWithdrawalHistory(): Promise<
  CounterWithdrawalEntry[]
> {
  try {
    const storedHistoryValue = await AsyncStorage.getItem(
      STORAGE_KEYS.counterWithdrawalHistory,
    );
    const parsed = normalizeStoredWithdrawalHistory(storedHistoryValue);

    if (parsed.isNormalized) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.counterWithdrawalHistory,
          JSON.stringify(parsed.history),
        );
      } catch {
        // Non-blocking; the normalized value will be retried on next read.
      }
    }

    return parsed.history;
  } catch {
    return [];
  }
}

export async function saveCounterWithdrawal(
  amount: number,
): Promise<CounterWithdrawalEntry[]> {
  const normalizedAmount = Math.floor(amount);
  if (
    !Number.isFinite(normalizedAmount) ||
    !Number.isInteger(normalizedAmount) ||
    normalizedAmount <= 0
  ) {
    return getStoredCounterWithdrawalHistory();
  }

  const existingHistory = await getStoredCounterWithdrawalHistory();
  const nextEntry: CounterWithdrawalEntry = {
    amount: normalizedAmount,
    createdAtIso: new Date().toISOString(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
  const nextHistory = [nextEntry, ...existingHistory].sort(compareNewestFirst);

  await AsyncStorage.setItem(
    STORAGE_KEYS.counterWithdrawalHistory,
    JSON.stringify(nextHistory),
  );

  return nextHistory;
}

export async function deleteCounterWithdrawal(
  entryId: string,
): Promise<CounterWithdrawalEntry[]> {
  const normalizedEntryId = entryId.trim();
  const existingHistory = await getStoredCounterWithdrawalHistory();

  if (normalizedEntryId.length === 0) {
    return existingHistory;
  }

  const nextHistory = existingHistory.filter(
    entry => entry.id !== normalizedEntryId,
  );

  await AsyncStorage.setItem(
    STORAGE_KEYS.counterWithdrawalHistory,
    JSON.stringify(nextHistory),
  );

  return nextHistory;
}
