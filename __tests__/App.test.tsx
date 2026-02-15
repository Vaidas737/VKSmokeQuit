import {act, render} from '@testing-library/react-native';

import App from '../App';

jest.mock('@/hooks/useThemePreference', () => ({
  useThemePreference: () => ({
    isReady: true,
    setThemeMode: jest.fn().mockResolvedValue(undefined),
    themeMode: 'system',
    toggleTheme: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/navigation/AppNavigator', () => {
  const React = require('react');
  const {Text} = require('react-native');

  return {
    AppNavigator: () =>
      React.createElement(
        Text,
        {
          testID: 'app-main-navigation',
        },
        'Main Navigation',
      ),
  };
});

describe('App startup splash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows splash for exactly 3 seconds before rendering app navigation', async () => {
    const {getByTestId, queryByTestId} = render(<App />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getByTestId('app-splash-screen')).toBeTruthy();
    expect(getByTestId('app-main-navigation')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2999);
    });

    expect(getByTestId('app-splash-screen')).toBeTruthy();
    expect(getByTestId('app-main-navigation')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(getByTestId('app-splash-screen')).toBeTruthy();
    expect(getByTestId('app-main-navigation')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(319);
    });

    expect(getByTestId('app-splash-screen')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(queryByTestId('app-splash-screen')).toBeNull();
    expect(getByTestId('app-main-navigation')).toBeTruthy();
  });
});
