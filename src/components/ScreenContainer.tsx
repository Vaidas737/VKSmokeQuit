import type {PropsWithChildren} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTheme} from '@/design/theme/ThemeProvider';

type ScreenContainerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({children, style}: ScreenContainerProps) {
  const {theme} = useTheme();

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.safeArea, {backgroundColor: theme.colors.background}]}
      testID="screen-container-safe-area">
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: theme.spacing[20],
            paddingTop: theme.spacing[20],
          },
          style,
        ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
