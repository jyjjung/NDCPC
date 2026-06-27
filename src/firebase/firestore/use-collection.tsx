'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { readCachedCollection, writeCachedCollection } from '@/lib/data-cache';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | null;
}

export interface UseCollectionOptions {
  cacheKey?: string;
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery:
    | CollectionReference<DocumentData>
    | Query<DocumentData>
    | null
    | undefined,
  options?: UseCollectionOptions
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const cacheKey = options?.cacheKey;

  const [data, setData] = useState<StateDataType>(() => {
    if (!cacheKey) return null;
    return readCachedCollection<ResultItemType>(cacheKey);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!cacheKey) return true;
    return readCachedCollection<ResultItemType>(cacheKey) === null;
  });
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (cacheKey) {
      const cached = readCachedCollection<ResultItemType>(cacheKey);
      if (cached) {
        setData(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }

    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
        if (cacheKey) {
          writeCachedCollection(cacheKey, results);
        }
      },
      (err: FirestoreError) => {
        console.error('Firestore Error in useCollection:', err);
        setError(err);
        if (!cacheKey || readCachedCollection<ResultItemType>(cacheKey) === null) {
          setData(null);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, cacheKey]);

  return { data, isLoading, error };
}
