import React, { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/stito/ConfirmDialog";
import {
  bindConfirmHost,
  resolveConfirm,
  type ConfirmOptions,
} from "@/lib/confirmAction";

/**
 * Imperative confirm UI for confirmAction(). Mount once near the app root.
 */
export function ConfirmHost() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    bindConfirmHost((pending) => {
      if (!pending) {
        setOptions(null);
        return;
      }
      const { resolve: _resolve, ...rest } = pending;
      setOptions(rest);
    });
    return () => bindConfirmHost(null);
  }, []);

  return (
    <ConfirmDialog
      visible={options != null}
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
