import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleMapViewer from '../components/SimpleMapViewer.tsx';
import { getFavoriteById, getORSDirections } from '../services/api.ts';
import { Button } from '../components/ui/button.tsx';
import { ArrowLeft, Heart, Clock, Coins, Repeat, PersonStanding, Bus, Footprints, CheckCircle, Loader2 } from 'lucide-react';

export default function SavedRouteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [route, setRoute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [geometries, setGeometries] = useState<any[]>([]);
    const [loadingGeometries, setLoadingGeometries] = useState(false);

    // Fetch saved route on mount
    useEffect(() => {
        const fetchRoute = async () => {
            if (!id) {
                navigate('/profile');
                return;
            }

            try {
                setLoading(true);
                const response = await getFavoriteById(id) as any;
                const favoriteData = response.favorite;

                if (favoriteData?.route) {
                    setRoute(favoriteData.route);
                } else {
                    setToast('Không tìm thấy lộ trình đã lưu.');
                    setTimeout(() => navigate('/profile'), 2000);
                }
            } catch (err: any) {
                console.error('Error fetching saved route:', err);
                setToast(err?.response?.data?.message || 'Không thể tải lộ trình.');
                setTimeout(() => navigate('/profile'), 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchRoute();
    }, [id, navigate]);

    // Fetch geometries for map
    useEffect(() => {
        const fetchGeometries = async () => {
            if (!route || !route.segments) return;

            setLoadingGeometries(true);
            const segmentGeometries: any[] = [];

            try {
                for (let i = 0; i < route.segments.length; i++) {
                    const segment = route.segments[i];

                    if (!segment.from_coordinates || !segment.to_coordinates) {
                        segmentGeometries.push(null);
                        continue;
                    }

                    try {
                        const result = await getORSDirections({
                            from: {
                                lat: segment.from_coordinates.lat,
                                lng: segment.from_coordinates.lng
                            },
                            to: {
                                lat: segment.to_coordinates.lat,
                                lng: segment.to_coordinates.lng
                            },
                            mode: segment.mode === 'walk' ? 'walk' : 'bus'
                        });

                        if (result.success && result.data.routes && result.data.routes.length > 0) {
                            const geometry = result.data.routes[0].decoded_geometry;
                            segmentGeometries.push(geometry);
                        } else {
                            segmentGeometries.push(null);
                        }
                    } catch (err) {
                        segmentGeometries.push(null);
                    }
                }

                setGeometries(segmentGeometries);
            } catch (err) {
                // Silent error handling
            } finally {
                setLoadingGeometries(false);
            }
        };

        fetchGeometries();
    }, [route]);

    // Toast auto-dismiss
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="h-12 w-12 text-red animate-spin" />
                    <p className="text-lg text-gray-600">Đang tải lộ trình...</p>
                </div>
            </div>
        );
    }

    if (!route) {
        return null;
    }

    // Prepare coordinates for map
    const mapCoordinates = [
        { ...route.from, name: 'Điểm đi' },
        { ...route.to, name: 'Điểm đến' }
    ];

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="mb-4 pl-0 hover:bg-transparent hover:text-red"
            >
                <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
            </Button>

            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-navy mb-2">
                            Lộ trình đã lưu
                        </h1>
                        <p className="text-lg text-gray-600">
                            <span className="font-semibold">{route.from.name}</span>
                            {' → '}
                            <span className="font-semibold">{route.to.name}</span>
                        </p>
                    </div>
                    {/* Saved indicator - disabled */}
                    <Button
                        disabled
                        variant="default"
                        className="bg-red text-white cursor-not-allowed opacity-75"
                    >
                        <Heart className="h-4 w-4 mr-2 fill-current" />
                        Đã lưu
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-red" />
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Thời gian</h3>
                        </div>
                        <p className="text-2xl font-bold text-navy">{route.summary.totalDuration} phút</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Coins className="h-4 w-4 text-red" />
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Chi phí</h3>
                        </div>
                        <p className="text-2xl font-bold text-navy">{(route.details?.total_fare || route.summary.totalCost || 0).toLocaleString()}₫</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Repeat className="h-4 w-4 text-red" />
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Số tuyến</h3>
                        </div>
                        <p className="text-2xl font-bold text-navy">{route.summary.transfers} lần</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <PersonStanding className="h-4 w-4 text-red" />
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Đi bộ</h3>
                        </div>
                        <p className="text-2xl font-bold text-navy">{Math.ceil((route.details?.walking_time_sec || 0) / 60)} phút</p>
                    </div>
                </div>
            </header>

            {/* Main Content: Map + Instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Map Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loadingGeometries && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-orange z-10">
                                <p className="text-sm text-orange font-semibold">Đang tải đường đi...</p>
                            </div>
                        )}
                        <div className="h-[500px]">
                            <SimpleMapViewer
                                coordinates={mapCoordinates}
                                geometries={geometries.filter(g => g !== null)}
                                segments={route.segments || []}
                            />
                        </div>
                    </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-navy mb-6 pb-4 border-b border-gray-100">
                        Chi tiết
                    </h2>
                    <div className="space-y-4">
                        {route.segments.map((segment: any, idx: number) => (
                            <div key={idx} className="relative">
                                {/* Step Number */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        {idx < route.segments.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                        )}
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 pb-6">
                                        {segment.mode === 'walk' ? (
                                            <div>
                                                <h3 className="font-bold text-navy mb-2 flex items-center gap-2">
                                                    <Footprints className="h-4 w-4" />
                                                    Đi bộ
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    {segment.fromStopName || route.from.name}
                                                    {' → '}
                                                    {segment.toStopName || route.to.name}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Khoảng {segment.duration} phút
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="font-bold text-navy mb-2 flex items-center gap-2">
                                                    <Bus className="h-4 w-4" />
                                                    Đi xe buýt {segment.lineName}
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                                        <p className="text-xs text-green-700 font-semibold mb-1">Lên xe tại:</p>
                                                        <p className="text-green-900">{segment.fromStopName}</p>
                                                    </div>
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                                        <p className="text-xs text-red-700 font-semibold mb-1">Xuống xe tại:</p>
                                                        <p className="text-red-900">{segment.toStopName}</p>
                                                    </div>
                                                    <div className="flex gap-4 text-xs text-gray-500 pt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {segment.duration} phút
                                                        </span>
                                                        {segment.cost && segment.cost > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Coins className="h-3 w-3" />
                                                                {segment.cost.toLocaleString()}₫
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Final destination marker */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-600">Đến nơi!</h3>
                                <p className="text-sm text-gray-600">{route.to.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 bg-navy text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4">
                    {toast}
                </div>
            )}
        </div>
    );
}
