import { useCallback, useState } from 'react';

interface Position {
    lat: number;
    lng: number;
}

interface UseGeolocationReturn {
    position: Position | null;
    error: string | null;
    loading: boolean;
    requestPosition: () => Promise<Position>;
}

export default function useGeolocation(): UseGeolocationReturn {
    const [position, setPosition] = useState<Position | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const requestPosition = useCallback(() => {
        if (!navigator.geolocation) {
            const message = 'Thiết bị không hỗ trợ xác định vị trí.';
            setError(message);
            return Promise.reject(new Error(message));
        }

        setLoading(true);
        setError(null);

        return new Promise<Position>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (coords) => {
                    const payload = {
                        lat: coords.coords.latitude,
                        lng: coords.coords.longitude,
                    };
                    setPosition(payload);
                    setLoading(false);
                    resolve(payload);
                },
                (err) => {
                    const message =
                        err.code === err.PERMISSION_DENIED
                            ? 'Chức năng này cần quyền truy cập vị trí để hoạt động.'
                            : 'Không thể xác định vị trí của bạn lúc này.';
                    setError(message);
                    setLoading(false);
                    reject(new Error(message));
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }, []);

    return {
        position,
        error,
        loading,
        requestPosition,
    };
}
