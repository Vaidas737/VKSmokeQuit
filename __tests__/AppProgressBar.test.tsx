import React from 'react';
import {act, render} from '@testing-library/react-native';
import {AccessibilityInfo} from 'react-native';

import {AppProgressBar} from '@/components/AppProgressBar';
import {ThemeProvider} from '@/design/theme/ThemeProvider';

jest.mock('@/hooks/useThemePreference', () => ({
  useThemePreference: () => ({
    isReady: true,
    setThemeMode: jest.fn().mockResolvedValue(undefined),
    themeMode: 'system',
    toggleTheme: jest.fn().mockResolvedValue(undefined),
  }),
}));

const flushAsyncEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const hasIntervalDelay = (
  setIntervalSpy: jest.SpiedFunction<typeof global.setInterval>,
  delayMs: number,
) => setIntervalSpy.mock.calls.some(([, delay]) => delay === delayMs);

describe('AppProgressBar', () => {
  let isReduceMotionEnabledMock: jest.SpiedFunction<
    typeof AccessibilityInfo.isReduceMotionEnabled
  >;
  let addEventListenerMock: jest.SpiedFunction<
    typeof AccessibilityInfo.addEventListener
  >;

  beforeEach(() => {
    jest.useFakeTimers();
    isReduceMotionEnabledMock = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
    addEventListenerMock = jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation(() => ({remove: jest.fn()} as never));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('clamps accessibility progress to 0..100', async () => {
    const {UNSAFE_getByProps, rerender} = render(
      <ThemeProvider>
        <AppProgressBar progress={1.5} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();
    expect(
      UNSAFE_getByProps({accessibilityRole: 'progressbar'}).props.accessibilityValue
        .now,
    ).toBe(100);

    rerender(
      <ThemeProvider>
        <AppProgressBar progress={-0.4} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();
    expect(
      UNSAFE_getByProps({accessibilityRole: 'progressbar'}).props.accessibilityValue
        .now,
    ).toBe(0);
  });

  it('starts periodic pulse interval when enabled and reduce motion is off', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    render(
      <ThemeProvider>
        <AppProgressBar progress={0.5} pulseEnabled pulseIntervalMs={6000} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();

    expect(hasIntervalDelay(setIntervalSpy, 6000)).toBe(true);
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'reduceMotionChanged',
      expect.any(Function),
    );
  });

  it('does not start periodic pulse interval when reduce motion is on', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    isReduceMotionEnabledMock.mockResolvedValue(true);

    render(
      <ThemeProvider>
        <AppProgressBar progress={0.5} pulseEnabled pulseIntervalMs={6000} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();

    expect(hasIntervalDelay(setIntervalSpy, 6000)).toBe(false);
  });

  it('clears interval on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const {unmount} = render(
      <ThemeProvider>
        <AppProgressBar progress={0.5} pulseEnabled pulseIntervalMs={6000} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();
    const clearCallsBeforeUnmount = clearIntervalSpy.mock.calls.length;

    unmount();

    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(
      clearCallsBeforeUnmount,
    );
  });

  it('stops interval scheduling when pulseEnabled becomes false', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const {rerender} = render(
      <ThemeProvider>
        <AppProgressBar progress={0.5} pulseEnabled pulseIntervalMs={6000} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();
    const intervalCallsBeforeDisable = setIntervalSpy.mock.calls.filter(
      ([, delay]) => delay === 6000,
    ).length;
    const clearCallsBeforeDisable = clearIntervalSpy.mock.calls.length;

    rerender(
      <ThemeProvider>
        <AppProgressBar progress={0.5} pulseEnabled={false} pulseIntervalMs={6000} />
      </ThemeProvider>,
    );

    await flushAsyncEffects();

    const intervalCallsAfterDisable = setIntervalSpy.mock.calls.filter(
      ([, delay]) => delay === 6000,
    ).length;

    expect(intervalCallsAfterDisable).toBe(intervalCallsBeforeDisable);
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(
      clearCallsBeforeDisable,
    );
  });
});
