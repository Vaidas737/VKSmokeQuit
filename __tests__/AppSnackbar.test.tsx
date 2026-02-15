import {act, render} from '@testing-library/react-native';

import {AppSnackbar} from '@/components/AppSnackbar';
import {ThemeProvider} from '@/design/theme/ThemeProvider';

jest.mock('@/hooks/useThemePreference', () => ({
  useThemePreference: () => ({
    isReady: true,
    setThemeMode: jest.fn().mockResolvedValue(undefined),
    themeMode: 'system',
    toggleTheme: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('AppSnackbar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('resets auto-dismiss timing for a new event while visible', () => {
    const onDismiss = jest.fn();
    const {rerender} = render(
      <ThemeProvider>
        <AppSnackbar
          durationMs={3000}
          eventId={1}
          message="Theme changed to Light"
          onDismiss={onDismiss}
          tone="success"
          visible
        />
      </ThemeProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    rerender(
      <ThemeProvider>
        <AppSnackbar
          durationMs={3000}
          eventId={2}
          message="Theme changed to Dark"
          onDismiss={onDismiss}
          tone="success"
          visible
        />
      </ThemeProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders the latest event message', () => {
    const onDismiss = jest.fn();
    const {queryByText, rerender} = render(
      <ThemeProvider>
        <AppSnackbar
          eventId={1}
          message="Counter amount saved: 45 ILS/day"
          onDismiss={onDismiss}
          tone="success"
          visible
        />
      </ThemeProvider>,
    );

    expect(queryByText('Counter amount saved: 45 ILS/day')).toBeTruthy();

    rerender(
      <ThemeProvider>
        <AppSnackbar
          eventId={2}
          message="Counter amount saved: 50 ILS/day"
          onDismiss={onDismiss}
          tone="success"
          visible
        />
      </ThemeProvider>,
    );

    expect(queryByText('Counter amount saved: 45 ILS/day')).toBeNull();
    expect(queryByText('Counter amount saved: 50 ILS/day')).toBeTruthy();
  });

  it('does not reset timer when only onDismiss identity changes', () => {
    const onDismissFirst = jest.fn();
    const onDismissSecond = jest.fn();
    const {rerender} = render(
      <ThemeProvider>
        <AppSnackbar
          durationMs={3000}
          eventId={7}
          message="Theme changed to Light"
          onDismiss={onDismissFirst}
          tone="success"
          visible
        />
      </ThemeProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    rerender(
      <ThemeProvider>
        <AppSnackbar
          durationMs={3000}
          eventId={7}
          message="Theme changed to Light"
          onDismiss={onDismissSecond}
          tone="success"
          visible
        />
      </ThemeProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onDismissFirst).not.toHaveBeenCalled();
    expect(onDismissSecond).toHaveBeenCalledTimes(1);
  });
});
