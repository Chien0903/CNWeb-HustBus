// hooks/useRouteSearch.ts
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'home-map-search-state';

export function useRouteSearch() {
    const getSavedState = () => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    };

    const saved = getSavedState();

    const [fromPlace, setFromPlace] = useState<any>(saved.from ?? null);
    const [toPlace, setToPlace] = useState<any>(saved.to ?? null);
    const [routes, setRoutes] = useState<any[]>(saved.routes ?? []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ from: fromPlace, to: toPlace, routes })
        );
    }, [fromPlace, toPlace, routes]);

    const clear = () => {
        setFromPlace(null);
        setToPlace(null);
        setRoutes([]);
        setError(null);
        sessionStorage.removeItem(STORAGE_KEY);
    };

    return {
        fromPlace, setFromPlace,
        toPlace, setToPlace,
        routes, setRoutes,
        loading, setLoading,
        error, setError,
        clear,
    };
}
