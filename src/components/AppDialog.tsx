import {Modal, Pressable, StyleSheet, View} from 'react-native';

import {AppButton} from '@/components/AppButton';
import {AppCard} from '@/components/AppCard';
import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

type AppDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  message?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onDismiss: () => void;
  title: string;
  visible: boolean;
};

export function AppDialog({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  message,
  onCancel,
  onConfirm,
  onDismiss,
  title,
  visible,
}: AppDialogProps) {
  const {theme} = useTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: withOpacity(theme.colors.onBackground, theme.state.scrimOpacity),
          },
        ]}>
        <Pressable onPress={onDismiss} style={StyleSheet.absoluteFill} />

        <AppCard style={styles.dialogCard}>
          <AppText variant="headlineSmall">{title}</AppText>
          {message ? (
            <AppText color="onSurfaceVariant" style={styles.message} variant="bodyMedium">
              {message}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              onPress={onCancel ?? onDismiss}
              variant="tertiary"
              fullWidth={false}>
              {cancelLabel}
            </AppButton>
            <AppButton
              onPress={onConfirm ?? onDismiss}
              variant="primary"
              fullWidth={false}>
              {confirmLabel}
            </AppButton>
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  message: {
    marginTop: 12,
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dialogCard: {
    maxWidth: 420,
    width: '100%',
  },
});
