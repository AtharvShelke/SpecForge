"use client";

import { useCallback, useState } from "react";

export function useLoadingCounter() {
  const [count, setCount] = useState(0);
  const start = useCallback(() => setCount((c) => c + 1), []);
  const stop = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  const loading = count > 0;
  return { loading, start, stop };
}
