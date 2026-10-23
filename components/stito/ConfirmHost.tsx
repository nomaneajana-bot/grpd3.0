import React, { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/stito/ConfirmDialog";
import {
  bindConfirmHost,
  resolveConfirm,
  type ConfirmOptions,
} from "@/lib/confirmAction";

/**
 * Imperative confirm UI for confirmAction(). Mount once near the app root.
 * Keeps the last options while fading out so labels don't flash to defaults.
 */
export function ConfirmHost() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    bindConfirmHost((pending) => {
      if (!pending) {
        setVisible(false);
        return;
      }
      const { resolve: _resolve, ...rest } = pending;
      setOptions(rest);
      setVisible(true);
    });
    return () => bindConfirmHost(null);
  }, []);

  return (
    <ConfirmDialog
      visible={visible}
      title={options?.title ?? ""}
      message={options?.message ?? ""}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      destructive={options?.destructive}
      onConfirm={() => resolveConfirm(true)}
      onCancel={() => resolveConfirm(false)}
    />
  );
}
