import {calculateMonthRemainingProgress} from '@/utils/counterStorage';

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
