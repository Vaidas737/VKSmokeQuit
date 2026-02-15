import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '@/design/theme/ThemeProvider';
import {HomeScreen} from '@/screens/HomeScreen';

describe('HomeScreen', () => {
  it('renders the counter content', async () => {
    const {getByText} = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <HomeScreen />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    await waitFor(() => {
      expect(getByText(/Overall Total: ₪/)).toBeTruthy();
      expect(getByText(/This Month: ₪/)).toBeTruthy();
      expect(getByText(/Month Remaining: \d+%/)).toBeTruthy();
      expect(getByText('Daily Rate: ₪45/day')).toBeTruthy();
      expect(getByText(/Start Date:/)).toBeTruthy();
    });
  });
});
