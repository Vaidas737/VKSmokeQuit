import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';

import {AppCard} from '@/components/AppCard';
import {AppText} from '@/components/AppText';
import {AppButton} from '@/components/AppButton';
import {ScreenContainer} from '@/components/ScreenContainer';
import {ROUTES} from '@/constants/routes';
import {useTheme} from '@/design/theme/ThemeProvider';
import type {RootStackParamList} from '@/navigation/types';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({navigation}: HomeScreenProps) {
  const {theme} = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppCard>
          <AppText variant="headlineMedium">Smoke-Free Journey</AppText>
          <AppText
            color="onSurfaceVariant"
            style={{marginTop: theme.spacing[12]}}
            variant="bodyLarge">
            Stay focused with an iOS-first, fully offline app skeleton.
          </AppText>

          <View style={{marginTop: theme.spacing[20]}}>
            <AppButton onPress={() => navigation.navigate(ROUTES.About)} variant="tertiary">
              About
            </AppButton>
          </View>
        </AppCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});
