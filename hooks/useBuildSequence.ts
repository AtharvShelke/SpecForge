'use client';

import { useEffect, useState } from 'react';
import { BuildSequenceItem } from '@/types';

export function useBuildSequence() {
  const [buildSequence, setBuildSequence] = useState<BuildSequenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBuildSequence() {
      try {
        const response = await fetch('/api/categories/build-sequence');
        const data = await response.json();
        if (!cancelled) {
          setBuildSequence(data);
        }
      } catch (error) {
        console.error('Failed to fetch build sequence:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBuildSequence();
    return () => {
      cancelled = true;
    };
  }, []);

  return { buildSequence, loading };
}
