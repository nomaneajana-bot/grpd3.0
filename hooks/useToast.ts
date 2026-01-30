import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "info" | "success" | "error";

export type ToastData = {
  message: string;
  variant: ToastVariant;
};

export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      setToast({ message, variant });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast, hideToast };
}
