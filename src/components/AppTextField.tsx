import {useState} from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
  View,
} from 'react-native';

import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

type AppTextFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  error?: string;
  label: string;
};

export function AppTextField({
  containerStyle,
  disabled = false,
  error,
  label,
  onBlur,
  onFocus,
  style,
  ...props
}: AppTextFieldProps) {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={containerStyle}>
      <AppText
        color={hasError ? 'error' : 'onSurfaceVariant'}
        style={styles.label}
        variant="labelLarge">
        {label}
      </AppText>

      <View
        style={[
          styles.inputContainer,
          styles.minHeight,
          {
            backgroundColor: disabled
              ? withOpacity(theme.colors.onSurface, theme.state.disabledContainerOpacity)
              : theme.colors.surface,
            borderColor: hasError
              ? theme.colors.error
              : isFocused
                ? theme.colors.primary
                : theme.colors.outline,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing[12],
          },
          isFocused ? theme.elevation.level1 : null,
        ]}>
        <TextInput
          {...props}
          editable={!disabled}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          selectionColor={theme.colors.primary}
          style={[
            theme.typography.bodyLarge,
            styles.input,
            {
              color: disabled
                ? withOpacity(theme.colors.onSurface, theme.state.disabledContentOpacity)
                : theme.colors.onSurface,
            },
            style,
          ]}
        />
      </View>

      {hasError ? (
        <AppText color="error" style={styles.helperText} variant="labelMedium">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  helperText: {
    marginTop: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  inputContainer: {
    borderWidth: 1,
  },
  minHeight: {
    minHeight: 44,
  },
  label: {
    marginBottom: 6,
  },
});
