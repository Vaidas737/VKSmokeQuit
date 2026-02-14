import {useState} from 'react';
import {View} from 'react-native';

import {AppButton} from '@/components/AppButton';
import {AppCard} from '@/components/AppCard';
import {AppDialog} from '@/components/AppDialog';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';

export function AboutScreen() {
  const {theme} = useTheme();
  const [isDialogVisible, setDialogVisible] = useState(false);

  return (
    <ScreenContainer>
      <View style={{gap: theme.spacing[16]}}>
        <AppText variant="headlineSmall">About</AppText>

        <AppCard>
          <AppText variant="bodyLarge">
            VKSmokeQuit is an iOS-only React Native app skeleton built for an
            offline-first smoke-free journey experience.
          </AppText>

          <View style={{marginTop: theme.spacing[16]}}>
            <AppButton
              onPress={() => setDialogVisible(true)}
              variant="secondary"
              fullWidth={false}>
              Design System Promise
            </AppButton>
          </View>
        </AppCard>
      </View>

      <AppDialog
        confirmLabel="Understood"
        message="All new UI must use design tokens and App components. Hardcoded colors or spacing are not allowed."
        onDismiss={() => setDialogVisible(false)}
        title="Non-negotiable"
        visible={isDialogVisible}
      />
    </ScreenContainer>
  );
}
