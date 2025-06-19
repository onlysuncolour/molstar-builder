import { useCallback, useEffect, useRef } from "react";

import { Observable, Subscription } from 'rxjs';

export function useSubscribe() {
  const subsRef = useRef<Subscription[]>([])

  useEffect(() => {
    return () => {
      for (const s of subsRef.current) s.unsubscribe();
    }
  }, [])

  const subscribe = useCallback(<T>(obs: Observable<T>, action: (v: T) => void) => {
    subsRef.current.push(obs.subscribe(action));
  }, [])

  return {
    subscribe,
    subsRef
  }
}