import { useCallback, useRef, useEffect } from "react";

/**
 * Returns a stable callback that invokes `fn` only after `delay` ms have passed
 * since the last call. Pending invocations are cancelled on unmount or when
 * `delay` changes. Optionally cancel any pending call with the returned `cancel`.
 *
 * @param fn - Callback to debounce
 * @param delay - Delay in milliseconds
 * @returns [debouncedCallback, cancel] - debounced function and a cancel function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): [T, () => void] {
  const fnRef = useRef(fn);
  const delayRef = useRef(delay);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  fnRef.current = fn;
  delayRef.current = delay;

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debouncedFn = useCallback(
    ((...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        fnRef.current(...(lastArgsRef.current ?? []));
      }, delayRef.current);
    }) as T,
    [delay],
  );

  return [debouncedFn, cancel];
}
