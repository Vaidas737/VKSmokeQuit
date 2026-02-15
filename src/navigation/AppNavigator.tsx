import {createContext, useCallback, useContext, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  createNativeStackNavigator,
  type NativeStackHeaderProps,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {LeftDrawerMenu} from '@/components/LeftDrawerMenu';
import {AppTopBar} from '@/components/AppTopBar';
import {ROUTES} from '@/constants/routes';
import {useTheme} from '@/design/theme/ThemeProvider';
import {AppearanceScreen} from '@/screens/AppearanceScreen';
import {CounterScreen} from '@/screens/CounterScreen';
import {HomeScreen, type HomeScreenInitialData} from '@/screens/HomeScreen';

import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DrawerMenuContext = createContext<{
  openMenu: (navigation: NativeStackNavigationProp<RootStackParamList>) => void;
}>({
  openMenu: () => {},
});

function getTitleForRoute(routeName: keyof RootStackParamList): string {
  if (routeName === ROUTES.Home) {
    return 'Smoke-Free Journey';
  }

  if (routeName === ROUTES.Appearance) {
    return 'Appearance';
  }

  return 'Counter';
}

function TopBarHeader({back, navigation, route}: NativeStackHeaderProps) {
  const {openMenu} = useContext(DrawerMenuContext);
  const routeName = route.name as keyof RootStackParamList;
  const canGoBack = Boolean(back);

  return (
    <AppTopBar
      centerTitle={routeName === ROUTES.Home}
      leadingIcon={canGoBack ? 'back' : 'menu'}
      onLeadingPress={() => {
        if (canGoBack) {
          navigation.goBack();
          return;
        }

        openMenu(navigation as NativeStackNavigationProp<RootStackParamList>);
      }}
      title={getTitleForRoute(routeName)}
    />
  );
}

type AppNavigatorProps = {
  initialHomeData?: HomeScreenInitialData;
};

export function AppNavigator({initialHomeData}: AppNavigatorProps) {
  const {theme} = useTheme();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const sourceNavigation =
    useRef<NativeStackNavigationProp<RootStackParamList> | null>(null);

  const openMenu = useCallback(
    (navigation: NativeStackNavigationProp<RootStackParamList>) => {
      sourceNavigation.current = navigation;
      setMenuVisible(true);
    },
    [],
  );

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const openAppearance = useCallback(() => {
    sourceNavigation.current?.navigate(ROUTES.Appearance);
  }, []);

  const openCounter = useCallback(() => {
    sourceNavigation.current?.navigate(ROUTES.Counter);
  }, []);

  return (
    <DrawerMenuContext.Provider value={{openMenu}}>
      <View style={styles.root}>
        <Stack.Navigator
          initialRouteName={ROUTES.Home}
          screenOptions={() => ({
            contentStyle: {backgroundColor: theme.colors.background},
            header: TopBarHeader,
          })}>
          <Stack.Screen name={ROUTES.Home}>
            {() => (
              <HomeScreen
                initialData={initialHomeData}
                isMenuVisible={isMenuVisible}
              />
            )}
          </Stack.Screen>
          <Stack.Screen component={AppearanceScreen} name={ROUTES.Appearance} />
          <Stack.Screen component={CounterScreen} name={ROUTES.Counter} />
        </Stack.Navigator>

        <LeftDrawerMenu
          onClose={closeMenu}
          onOpenCounter={openCounter}
          onOpenAppearance={openAppearance}
          visible={isMenuVisible}
        />
      </View>
    </DrawerMenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
