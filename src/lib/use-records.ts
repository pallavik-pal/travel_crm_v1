'use client';

import { useEffect, useState } from 'react';

export function useRecords<T>(endpoint: string, fallback: T) {
  const [records, setRecords] = useState<T>(fallback);

  useEffect(() => {
    let active = true;

    fetch(endpoint, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${endpoint}`);
        }

        return response.json();
      })
      .then((data) => {
        if (active) {
          setRecords(data);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, [endpoint]);

  return [records, setRecords] as const;
}
