import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button.tsx';
import { Clock, Heart, Zap, Repeat, PersonStanding } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { getFavorites, saveFavorite, removeFavorite } from '../services/api.ts';

interface RouteSummaryCardProps {
    route: any;
    highlight?: boolean;
}

export default function RouteSummaryCard({
    route,
    highlight,
}: RouteSummaryCardProps) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [savedFavoriteId, setSavedFavoriteId] = useState<string | null>(null);

    const handleViewDetails = () => {
        navigate('/route-detail', { state: { route } });
    };

    const handleSave = async () => {
        if (!isAuthenticated) return;

        try {
            if (isSaved && savedFavoriteId) {
                await removeFavorite(savedFavoriteId);
                setIsSaved(false);
                setSavedFavoriteId(null);
            } else {
                const response = await saveFavorite({
                    routeId: route.id,
                    route: route
                }) as any;
                setIsSaved(true);
                setSavedFavoriteId(response.favorite?.id || null);
            }
        } catch (err) {
            // Silent fail
        }
    };

    // Check if route is already saved
    useEffect(() => {
        const checkIfSaved = async () => {
            if (!isAuthenticated || !route?.id) return;

            try {
                const response = await getFavorites() as any;
                const favorites = response.favorites || [];
                const existingFavorite = favorites.find((fav: any) => fav.routeId === route.id);

                if (existingFavorite) {
                    setIsSaved(true);
                    setSavedFavoriteId(existingFavorite.id);
                }
            } catch (err) {
                // Silent fail
            }
        };

        checkIfSaved();
    }, [isAuthenticated, route?.id]);

    return (
        <article className={`bg-yellow-50 rounded-xl p-5 shadow-sm border transition-all hover:shadow-md ${highlight ? 'border-red ring-1 ring-red/20' : 'border-gray-100'
            }`}>
            <header className="flex justify-between items-start mb-4">
                <div>
                    {/* <p className="text-xs font-semibold text-orange uppercase tracking-wider mb-1">{route.title}</p> */}
                    <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                        {route.from.name}
                    </h3>
                </div>
                <span className="flex items-center gap-1 text-lg font-bold text-navy bg-gray-50 px-3 py-1 rounded-lg">
                    <Clock className="h-4 w-4 text-red" />
                    {route.summary.totalDuration}p
                </span>
            </header>

            {/* Filter Tags */}
            {route.filters && route.filters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {route.filters.map((filter: string) => {
                        const filterConfig: Record<string, { label: string; icon: any; color: string }> = {
                            fastest: { label: 'Nhanh nhất', icon: Zap, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                            fewest_transfers: { label: 'Ít chuyển tuyến', icon: Repeat, color: 'bg-green-100 text-green-700 border-green-200' },
                            least_walking: { label: 'Ít đi bộ', icon: PersonStanding, color: 'bg-purple-100 text-purple-700 border-purple-200' },
                        };
                        const config = filterConfig[filter] || { label: filter, icon: null, color: 'bg-gray-100 text-gray-700' };
                        const Icon = config.icon;
                        return (
                            <span key={filter} className={`px-2 py-1 rounded-md text-xs font-semibold border flex items-center gap-1 ${config.color}`}>
                                {Icon && <Icon className="h-3 w-3" />}
                                {config.label}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Route info - hide fare and waiting time for walking-only routes */}
            {route.segments.length > 1 ? (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-50">
                    <span>
                        Chi phí: {(route.details?.total_fare || route.summary.totalCost || 0).toLocaleString()}đ
                    </span>
                    {route.details?.waiting_time_sec > 0 && (
                        <>
                            <span>•</span>
                            <span>Chờ: {Math.ceil((route.details?.waiting_time_sec || 0) / 60)} phút</span>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-50">
                    <span className="text-gray-500 italic">Chỉ cần đi bộ đến đích</span>
                </div>
            )}

            <ul className="flex flex-wrap gap-2 mb-4">
                {route.segments.map((segment: any, idx: number) => (
                    <li key={`${segment.lineId}-${segment.from}-${segment.to}-${idx}`} className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${segment.mode === 'walk'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                            {segment.mode === 'walk' ? 'Đi bộ' : segment.lineName}
                        </span>
                        <span className="text-xs text-gray-500">
                            {segment.duration}p
                            {segment.waiting_time_sec && segment.waiting_time_sec > 0 && (
                                <span className="text-red ml-1">
                                    + Chờ {Math.ceil(segment.waiting_time_sec / 60)}p
                                </span>
                            )}
                        </span>
                        {idx < route.segments.length - 1 && <span className="text-gray-300">→</span>}
                    </li>
                ))}
            </ul>

            <footer className="flex justify-between items-center pt-3 mt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewDetails}
                    className="text-navy hover:bg-red-600 hover:text-white active:bg-red-600 active:text-white hover:border-red-600 active:border-red-600 transition-colors"
                >
                    Xem chi tiết
                </Button>
                <div>
                    {isAuthenticated && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSave}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <Heart className={`h-4 w-4 mr-1 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                            {isSaved ? 'Đã lưu' : 'Lưu'}
                        </Button>
                    )}
                </div>
            </footer>
        </article>
    );
}
