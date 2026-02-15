import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {StyleSheet, View} from 'react-native';

export type AppOverlayLayer = 'base' | 'snackbar';

type OverlayEntry = {
  children: ReactNode;
  key: number;
  layer: AppOverlayLayer;
};

type AppOverlayManager = {
  mount: (layer: AppOverlayLayer, children: ReactNode) => number;
  unmount: (key: number) => void;
  update: (key: number, layer: AppOverlayLayer, children: ReactNode) => void;
};

const AppOverlayContext = createContext<AppOverlayManager | null>(null);

function renderOverlayEntry(entry: OverlayEntry) {
  return (
    <View
      collapsable={false}
      key={entry.key}
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}>
      {entry.children}
    </View>
  );
}

export function AppOverlayProvider({children}: PropsWithChildren) {
  const nextKeyRef = useRef(0);
  const [entries, setEntries] = useState<OverlayEntry[]>([]);

  const mount = useCallback((layer: AppOverlayLayer, overlayChildren: ReactNode) => {
    const key = nextKeyRef.current++;
    setEntries(previous => [
      ...previous,
      {
        children: overlayChildren,
        key,
        layer,
      },
    ]);

    return key;
  }, []);

  const update = useCallback((key: number, layer: AppOverlayLayer, overlayChildren: ReactNode) => {
    setEntries(previous =>
      previous.map(entry =>
        entry.key === key
          ? {
              ...entry,
              children: overlayChildren,
              layer,
            }
          : entry,
      ),
    );
  }, []);

  const unmount = useCallback((key: number) => {
    setEntries(previous => previous.filter(entry => entry.key !== key));
  }, []);

  const manager = useMemo<AppOverlayManager>(
    () => ({
      mount,
      unmount,
      update,
    }),
    [mount, unmount, update],
  );

  const baseLayerEntries = entries.filter(entry => entry.layer === 'base');
  const snackbarLayerEntries = entries.filter(entry => entry.layer === 'snackbar');

  return (
    <AppOverlayContext.Provider value={manager}>
      <View collapsable={false} pointerEvents="box-none" style={styles.root}>
        <View collapsable={false} pointerEvents="box-none" style={styles.content}>
          {children}
        </View>

        <View pointerEvents="box-none" style={styles.layer}>
          {baseLayerEntries.map(renderOverlayEntry)}
        </View>

        <View pointerEvents="box-none" style={styles.layer}>
          {snackbarLayerEntries.map(renderOverlayEntry)}
        </View>
      </View>
    </AppOverlayContext.Provider>
  );
}

export function useAppOverlayManager(): AppOverlayManager {
  const context = useContext(AppOverlayContext);

  if (!context) {
    throw new Error('useAppOverlayManager must be used within AppOverlayProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  root: {
    flex: 1,
  },
});
