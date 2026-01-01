import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common.Authorization;
    }
};

const unwrap = <T>(promise: Promise<{ data: T }>): Promise<T> => promise.then((res) => res.data);

export const findRoutes = (payload: any) => unwrap(apiClient.post('/path/find', payload));

export const getRouteDetails = (routeId: string) =>
    unwrap(apiClient.get('/route/details', { params: { id: routeId } }));

export const getNearbyStops = (coords: { lat: number; lng: number }) =>
    unwrap(apiClient.get('/nearby', { params: coords }));

export const searchLines = (query: string) =>
    unwrap(apiClient.get('/search/line', { params: { q: query } }));

export const getLineDetails = (id: string) =>
    unwrap(apiClient.get('/search/line/details', { params: { id } }));

export const register = (payload: any) => unwrap(apiClient.post('/auth/register', payload));

export const login = (payload: any) => unwrap(apiClient.post('/auth/login', payload));

export const getCurrentUser = () => unwrap(apiClient.get('/auth/me'));

export const fetchProfile = () => unwrap(apiClient.get('/auth/me'));

export const getFavorites = () => unwrap(apiClient.get('/user/favorites'));

export const getFavoriteById = (id: string) => unwrap(apiClient.get(`/user/favorites/${id}`));

export const saveFavorite = (payload: any) => unwrap(apiClient.post('/user/favorites', payload));

export const removeFavorite = (id: string) =>
    unwrap(apiClient.delete(`/user/favorites/${id}`));

export const getHistory = () => unwrap(apiClient.get('/user/history'));

export const addHistory = (payload: any) => unwrap(apiClient.post('/user/history', payload));

export const deleteHistory = (id: string) => unwrap(apiClient.delete(`/user/history/${id}`));

// Upload avatar
export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/upload/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Aliases for older imports
export const saveSearchHistory = addHistory;

// Save search history to Redis  
export const saveSearchHistoryToRedis = (payload: {
    fromLabel: string;
    toLabel: string;
    fromCoords: { lat: number; lng: number };
    toCoords: { lat: number; lng: number };
}) => unwrap(apiClient.post('/path/save-history', payload));

// Stop endpoints
export const getAllStops = () => unwrap(apiClient.get('/stop'));

export const getStopById = (stopId: string) =>
    unwrap(apiClient.get(`/stop/${stopId}`));

export const getStopWithTimes = (stopId: string) =>
    unwrap(apiClient.get(`/stop/${stopId}/times`));

export const createStop = (payload: any) =>
    unwrap(apiClient.post('/stop', payload));

// Bus Routes API
export const searchBusRoutes = (query: string) =>
    unwrap(apiClient.get('/bus-lines/search', { params: { q: query } }));

export const getBusLineDetails = (name: string) =>
    unwrap(apiClient.get('/bus-lines/details', { params: { name } }));

export const getBusRouteSchedule = (routeId: string) =>
    unwrap(apiClient.get('/bus-lines/schedule', { params: { routeId } }));

// Admin Bus Routes API
export const createBusRoute = (data: any) => unwrap(apiClient.post('/bus-lines', data));

export const updateBusRoute = (id: string, data: any) => unwrap(apiClient.put(`/bus-lines/${id}`, data));

export const deleteBusRoute = (id: string) => unwrap(apiClient.delete(`/bus-lines/${id}`));

// Reviews API
export const getReviews = (targetType: string, targetId: string) =>
    unwrap(apiClient.get('/reviews', { params: { targetType, targetId } }));

export const submitReview = (payload: any) => unwrap(apiClient.post('/reviews', payload));
export const deleteReview = (id: string) => unwrap(apiClient.delete(`/reviews/${id}`));

// Admin users API
export const getUsers = () => unwrap(apiClient.get('/admin/users'));
export const getUsersAdmin = getUsers;

export const updateUserRole = (id: string, role: string) =>
    unwrap(apiClient.patch(`/admin/users/${id}/role`, { role }));

export const deleteUser = (id: string) => unwrap(apiClient.delete(`/admin/users/${id}`));
export const deleteUserAdmin = deleteUser;

// Walking Route API
export const getWalkingRoute = (stopId: string, originLat: number, originLng: number) =>
    unwrap(apiClient.get(`/route/walking-route/${stopId}`, {
        params: { originLat, originLng }
    }));

// Admin Statistics API
export const getAdminStats = () => unwrap(apiClient.get('/admin/stats'));

// ORS API - Get route geometry
export const getORSDirections = async (params: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    mode: 'walk' | 'bus';
}) => {
    const profile = params.mode === 'walk' ? 'foot-walking' : 'driving-car';
    const response = await apiClient.post('/ors/directions', {
        coordinates: [
            [params.from.lng, params.from.lat],
            [params.to.lng, params.to.lat]
        ],
        profile
    });
    return response.data;
};
// Token refresh queue management
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// Response interceptor for automatic token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh for auth endpoints
        if (originalRequest.url?.includes('/auth/')) {
            return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request while another is refreshing
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('transit-auth-refresh');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Call refresh endpoint
                const response = await apiClient.post('/auth/refresh', { refreshToken });
                const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

                // Update tokens in localStorage
                const authData = JSON.parse(localStorage.getItem('transit-auth') || '{}');
                authData.token = newAccessToken;
                localStorage.setItem('transit-auth', JSON.stringify(authData));
                localStorage.setItem('transit-auth-refresh', newRefreshToken);

                // Update default header
                setAuthToken(newAccessToken);

                // Process queued requests
                processQueue(null, newAccessToken);
                isRefreshing = false;

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                // Clear tokens and redirect to login
                localStorage.removeItem('transit-auth');
                localStorage.removeItem('transit-auth-refresh');

                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Logout API call
export const logoutApi = async () => {
    const refreshToken = localStorage.getItem('transit-auth-refresh');
    if (refreshToken) {
        try {
            await apiClient.post('/auth/logout', { refreshToken });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
};

// Logout from all devices
export const logoutAllDevices = async () => {
    try {
        await apiClient.post('/auth/logout-all');
        localStorage.removeItem('transit-auth');
        localStorage.removeItem('transit-auth-refresh');
    } catch (error) {
        console.error('Logout all devices error:', error);
        throw error;
    }
};


// Health check endpoint
export const healthCheck = () =>
    unwrap(apiClient.get('/health', { baseURL: API_BASE }));

export default apiClient;
