import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {render, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '@/design/theme/ThemeProvider';
import type {RootStackParamList} from '@/navigation/types';
import {HomeScreen} from '@/screens/HomeScreen';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

describe('HomeScreen', () => {
  it('renders the title', async () => {
    const props = {
      navigation: {
        navigate: jest.fn(),
      },
      route: {
        key: 'home-key',
        name: 'Home',
      },
    } as unknown as HomeScreenProps;

    const {getByText} = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <HomeScreen {...props} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    await waitFor(() => {
      expect(getByText('Smoke-Free Journey')).toBeTruthy();
    });
  });
});
