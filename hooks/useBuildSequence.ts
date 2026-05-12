'use client';

import { useEffect, useState, useCallback } from 'react';
import { BuildSequenceItem, Category } from '@/types';


export function useBuildSequence() {
  const [buildSequence, setBuildSequence] = useState<BuildSequenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBuildSequence() {
      try {
        setError(null);
        
        const response = await fetch('/api/categories/build-sequence');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setBuildSequence(data);
          } else {
            // API returned empty or invalid data
            throw new Error('No build sequence configured. Please configure categories in the admin panel.');
          }
        }
      } catch (error) {
        console.error('Failed to fetch build sequence:', error);
        
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load build sequence. Please check admin panel configuration.');
          setBuildSequence([]);
        }
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

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Trigger reload by setting a new timestamp
    const controller = new AbortController();
    const signal = controller.signal;
    
    fetch('/api/categories/build-sequence', { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBuildSequence(data);
          setError(null);
        } else {
          throw new Error('No build sequence configured. Please configure categories in the admin panel.');
        }
      })
      .catch(error => {
        console.error('Retry failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to load build sequence. Please check admin panel configuration.');
        setBuildSequence([]);
      })
      .finally(() => {
        setLoading(false);
      });
      
    return () => controller.abort();
  }, []);

  return { 
    buildSequence, 
    loading, 
    error, 
    retry 
  };
}
