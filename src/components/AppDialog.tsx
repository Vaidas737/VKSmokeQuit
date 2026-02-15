import {useEffect, useRef, useState, type ReactNode} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {AppOverlayPortal} from '@/components/overlay/AppOverlayPortal';
import {AppButton} from '@/components/AppButton';
import {AppCard} from '@/components/AppCard';
import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

type AppDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  onClosed?: () => void;
  message?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onDismiss: () => void;
  title: string;
  visible: boolean;
};

const OPEN_DURATION_MS = 300;
const CLOSE_DURATION_MS = 240;

export function AppDialog({
  cancelLabel = 'Cancel',
  children,
  confirmDisabled = false,
  confirmLabel = 'Confirm',
  onClosed,
  message,
  onCancel,
  onConfirm,
  onDismiss,
  title,
  visible,
}: AppDialogProps) {
  const {theme} = useTheme();
  const animationProgressRef = useRef(new Animated.Value(visible ? 1 : 0));
  const animationProgress = animationProgressRef.current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    animationProgress.stopAnimation();
    Animated.timing(animationProgress, {
      duration: visible ? OPEN_DURATION_MS : CLOSE_DURATION_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished && !visible) {
        setIsRendered(false);
        onClosed?.();
      }
    });
  }, [animationProgress, isRendered, onClosed, visible]);

  if (!isRendered) {
    return null;
  }

  const dialogOpacity = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const dialogTranslateY = visible
    ? animationProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.spacing[24], 0],
      })
    : 0;

  return (
    <AppOverlayPortal>
      <View
        pointerEvents="box-none"
        style={styles.root}>
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: withOpacity(theme.colors.onBackground, theme.state.scrimOpacity),
              opacity: animationProgress,
            },
          ]}>
          <Pressable onPress={onDismiss} style={StyleSheet.absoluteFill} />
          <Animated.View
            style={[
              styles.dialogCardContainer,
              {
                opacity: dialogOpacity,
                transform: [{translateY: dialogTranslateY}],
              },
            ]}>
            <AppCard style={styles.dialogCard}>
              <AppText variant="headlineSmall">{title}</AppText>
              {message ? (
                <AppText color="onSurfaceVariant" style={styles.message} variant="bodyMedium">
                  {message}
                </AppText>
              ) : null}
              {children ? <View style={styles.content}>{children}</View> : null}

              <View style={styles.actions}>
                <AppButton
                  onPress={onCancel ?? onDismiss}
                  variant="tertiary"
                  fullWidth={false}>
                  {cancelLabel}
                </AppButton>
                <AppButton
                  disabled={confirmDisabled}
                  onPress={onConfirm ?? onDismiss}
                  variant="primary"
                  fullWidth={false}>
                  {confirmLabel}
                </AppButton>
              </View>
            </AppCard>
          </Animated.View>
        </Animated.View>
      </View>
    </AppOverlayPortal>
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
    width: '100%',
  },
  dialogCardContainer: {
    maxWidth: 420,
    width: '100%',
  },
  content: {
    marginTop: 12,
  },
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
  },
});
