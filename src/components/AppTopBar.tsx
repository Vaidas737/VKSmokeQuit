import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';

type LeadingIcon = 'back' | 'close' | 'menu';

type AppTopBarProps = {
  centerTitle?: boolean;
  leadingIcon?: LeadingIcon;
  onLeadingPress?: () => void;
  title: string;
};

const BAR_HEIGHT = 64;

function MenuGlyph({color}: {color: string}) {
  return (
    <View style={styles.menuGlyph}>
      <View style={[styles.menuLine, {backgroundColor: color}]} />
      <View style={[styles.menuLine, {backgroundColor: color}]} />
      <View style={[styles.menuLine, {backgroundColor: color}]} />
    </View>
  );
}

function BackGlyph({color}: {color: string}) {
  return (
    <AppText style={[styles.backGlyph, {color}]}>
      {'<'}
    </AppText>
  );
}

function CloseGlyph({color}: {color: string}) {
  return <AppText style={[styles.closeGlyph, {color}]}>X</AppText>;
}

export function AppTopBar({
  centerTitle = false,
  leadingIcon,
  onLeadingPress,
  title,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const [isLeadingFocused, setLeadingFocused] = useState(false);

  const renderLeadingGlyph = () => {
    if (!leadingIcon) {
      return null;
    }

    if (leadingIcon === 'menu') {
      return <MenuGlyph color={theme.colors.onSurface} />;
    }

    if (leadingIcon === 'close') {
      return <CloseGlyph color={theme.colors.onSurface} />;
    }

    return <BackGlyph color={theme.colors.onSurface} />;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
          minHeight: BAR_HEIGHT + insets.top,
          paddingTop: insets.top,
        },
      ]}>
      <View style={styles.content}>
        <View style={styles.leadingContainer}>
          {leadingIcon && onLeadingPress ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onBlur={() => setLeadingFocused(false)}
              onFocus={() => setLeadingFocused(true)}
              onPress={onLeadingPress}
              style={({pressed}) => [
                styles.leadingButton,
                {
                  borderColor: isLeadingFocused ? theme.colors.primary : 'transparent',
                  borderRadius: theme.radius.md,
                  borderWidth: isLeadingFocused ? 2 : 0,
                },
                pressed ? styles.pressed : null,
              ]}>
              {renderLeadingGlyph()}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.titleContainer}>
          <AppText
            numberOfLines={1}
            style={centerTitle ? styles.centerText : styles.leftText}
            variant="titleLarge">
            {title}
          </AppText>
        </View>

        <View style={styles.trailingContainer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backGlyph: {
    fontSize: 24,
    lineHeight: 24,
  },
  centerText: {
    textAlign: 'center',
  },
  closeGlyph: {
    fontSize: 20,
    lineHeight: 20,
  },
  container: {
    borderBottomWidth: 1,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: BAR_HEIGHT,
    paddingHorizontal: 8,
  },
  leadingButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  leadingContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 44,
  },
  menuGlyph: {
    gap: 4,
  },
  menuLine: {
    borderRadius: 999,
    height: 2,
    width: 18,
  },
  pressed: {
    opacity: 0.88,
  },
  leftText: {
    textAlign: 'left',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  trailingContainer: {
    width: 44,
  },
});
