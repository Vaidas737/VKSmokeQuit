import AsyncStorage from '@react-native-async-storage/async-storage';

import {STORAGE_KEYS} from '@/constants/storage';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_DAILY_AMOUNT = 45;

type CounterSettings = {
  dailyAmount: number;
  startDate: Date;
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
