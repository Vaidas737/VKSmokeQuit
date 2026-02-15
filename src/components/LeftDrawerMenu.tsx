import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {AppListRow} from '@/components/AppListRow';
import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

const MIN_DRAWER_WIDTH = 296;
const ANIMATION_MS = 180;
const SCRIM_ANIMATION_MS = 260;
const SWIPE_START_THRESHOLD = 8;
const SWIPE_CLOSE_VELOCITY = 0.3;

type LeftDrawerMenuProps = {
  onClose: () => void;
  onOpenAppearance: () => void;
  onOpenCounter: () => void;
  visible: boolean;
};

export function LeftDrawerMenu({
  onClose,
  onOpenAppearance,
  onOpenCounter,
  visible,
}: LeftDrawerMenuProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const {theme} = useTheme();
  const {width: windowWidth} = useWindowDimensions();
  const drawerWidth = Math.max(
    MIN_DRAWER_WIDTH,
    windowWidth - (theme.spacing[48] + theme.spacing[12]),
  );
  const menuScrimOpacity = theme.state.scrimOpacity * 0.5;
  const swipeCloseDistance = theme.spacing[24];
  const menuHeaderStyle = useMemo(
    () => ({
      marginBottom: theme.spacing[12],
      marginTop: theme.spacing[12],
      paddingHorizontal: theme.spacing[16],
      paddingVertical: theme.spacing[12],
    }),
    [theme.spacing],
  );
  const menuHeaderIconStyle = useMemo(
    () => ({
      marginRight: theme.spacing[8],
    }),
    [theme.spacing],
  );
  const menuHeaderIconBadgeStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing[20],
      height: theme.spacing[40],
      width: theme.spacing[40],
    }),
    [theme.colors.primary, theme.spacing],
  );
  const drawerX = useRef(new Animated.Value(-drawerWidth)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);

          return isHorizontal && gestureState.dx < -SWIPE_START_THRESHOLD;
        },
        onPanResponderRelease: (_, gestureState) => {
          const swipedFarEnough = gestureState.dx <= -swipeCloseDistance;
          const swipedFastEnough = gestureState.vx <= -SWIPE_CLOSE_VELOCITY;

          if (swipedFarEnough || swipedFastEnough) {
            onClose();
          }
        },
      }),
    [onClose, swipeCloseDistance],
  );

  useEffect(() => {
    if (!visible && !isMounted) {
      drawerX.setValue(-drawerWidth);
    }
  }, [drawerWidth, drawerX, isMounted, visible]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      Animated.parallel([
        Animated.timing(drawerX, {
          duration: ANIMATION_MS,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scrimOpacity, {
          duration: SCRIM_ANIMATION_MS,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(drawerX, {
        duration: ANIMATION_MS,
        toValue: -drawerWidth,
        useNativeDriver: true,
      }),
      Animated.timing(scrimOpacity, {
        duration: SCRIM_ANIMATION_MS,
        easing: Easing.inOut(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [drawerWidth, drawerX, scrimOpacity, visible]);

  if (!isMounted) {
    return null;
  }

  return (
    <View pointerEvents={visible ? 'box-none' : 'none'} style={styles.overlay}>
      <Animated.View
        style={[
          styles.scrim,
          {
            backgroundColor: withOpacity(theme.colors.onBackground, menuScrimOpacity),
            opacity: scrimOpacity,
          },
        ]}>
        <Pressable accessibilityLabel="Close menu" onPress={onClose} style={styles.scrimPressable} />
      </Animated.View>

      <Animated.View
        {...drawerPanResponder.panHandlers}
        style={[
          styles.drawer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
            transform: [{translateX: drawerX}],
            width: drawerWidth,
          },
          theme.elevation.level3,
        ]}>
        <SafeAreaView edges={['top', 'left', 'bottom']} style={styles.drawerSafeArea}>
          <View style={[styles.menuHeader, menuHeaderStyle]}>
            <View style={[styles.menuHeaderIconBadge, menuHeaderIconStyle, menuHeaderIconBadgeStyle]}>
              <MaterialIcons color={theme.colors.onPrimary} name="smoke-free" size={theme.spacing[24]} />
            </View>
            <AppText color="primary" variant="headlineSmall">
              Smoke Free
            </AppText>
          </View>

          <AppListRow
            leading={
              <MaterialIcons
                color={theme.colors.onSurfaceVariant}
                name="calculate"
                size={theme.spacing[24]}
              />
            }
            onPress={() => {
              onClose();
              onOpenCounter();
            }}
            title="Counter"
          />

          <AppListRow
            leading={
              <MaterialIcons
                color={theme.colors.onSurfaceVariant}
                name="palette"
                size={theme.spacing[24]}
              />
            }
            onPress={() => {
              onClose();
              onOpenAppearance();
            }}
            title="Appearance"
          />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    borderRightWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  drawerSafeArea: {
    flex: 1,
  },
  menuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  menuHeaderIconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimPressable: {
    flex: 1,
  },
});
