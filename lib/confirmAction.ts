import { Alert } from "react-native";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type Listener = (pending: PendingConfirm | null) => void;

let listener: Listener | null = null;
let pending: PendingConfirm | null = null;

/** Mounted by ConfirmHost so imperative confirmAction can drive the Stito dialog. */
export function bindConfirmHost(next: Listener | null): void {
  listener = next;
  if (next && pending) {
    next(pending);
  }
}

function nativeAlertFallback(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    destructive = false,
  } = options;

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Returns true if user confirmed. Uses Stito ConfirmHost when mounted. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (!listener) {
    return nativeAlertFallback(options);
  }

  return new Promise((resolve) => {
    if (pending) {
      pending.resolve(false);
    }
    pending = { ...options, resolve };
    listener?.(pending);
  });
}

export function resolveConfirm(value: boolean): void {
  const current = pending;
  pending = null;
  listener?.(null);
  current?.resolve(value);
}
