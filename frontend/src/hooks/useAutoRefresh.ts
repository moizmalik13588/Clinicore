import { useEffect, useRef, useState, useCallback } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs = 30_000) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const timerRef = useRef<any>(null);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await callback();
        } finally {
            setIsRefreshing(false);
        }
    }, [callback]);

    useEffect(() => {
        timerRef.current = setInterval(callback, intervalMs);
        return () => clearInterval(timerRef.current);
    }, [callback, intervalMs]);

    return { isRefreshing, refresh };
}