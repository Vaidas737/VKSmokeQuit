import {useEffect, useRef, type ReactNode} from 'react';

import {
  type AppOverlayLayer,
  useAppOverlayManager,
} from '@/components/overlay/AppOverlayProvider';

type AppOverlayPortalProps = {
  children: ReactNode;
  layer?: AppOverlayLayer;
};

export function AppOverlayPortal({
  children,
  layer = 'base',
}: AppOverlayPortalProps) {
  const manager = useAppOverlayManager();
  const portalKeyRef = useRef<number | null>(null);
  const latestChildrenRef = useRef(children);
  const latestLayerRef = useRef(layer);

  latestChildrenRef.current = children;
  latestLayerRef.current = layer;

  useEffect(() => {
    portalKeyRef.current = manager.mount(
      latestLayerRef.current,
      latestChildrenRef.current,
    );

    return () => {
      if (portalKeyRef.current === null) {
        return;
      }

      manager.unmount(portalKeyRef.current);
      portalKeyRef.current = null;
    };
  }, [manager]);

  useEffect(() => {
    if (portalKeyRef.current === null) {
      return;
    }

    manager.update(portalKeyRef.current, layer, children);
  }, [children, layer, manager]);

  return null;
}
