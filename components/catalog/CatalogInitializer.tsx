'use client';

import { useEffect } from 'react';
import { useGarlandStore } from '@/store/garlandStore';

export function CatalogInitializer() {
  const fetchGarlands = useGarlandStore((s) => s.fetchGarlands);

  useEffect(() => {
    // Purge legacy persisted cache if present
    try {
      localStorage.removeItem('malligai-garlands-catalog');
    } catch (e) {
      // ignore
    }

    // Initial background sync
    fetchGarlands();
  }, [fetchGarlands]);

  return null;
}
