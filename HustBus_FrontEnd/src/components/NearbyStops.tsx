import { useState } from 'react';
import useGeolocation from '../hooks/useGeolocation.ts';
import { getNearbyStops, getWalkingRoute } from '../services/api.ts';
import { Button } from './ui/button.tsx';
import { MapPin, Map as MapIcon, Info } from 'lucide-react';
import WalkingRouteMap from './WalkingRouteMap.tsx';
import StopDetailModal from './StopDetailModal.tsx';

interface NearbyStopsProps {
    onSelectStop?: (stop: any) => void;
}

export default function NearbyStops({ onSelectStop }: NearbyStopsProps) {
    const { requestPosition, loading: geoLoading } = useGeolocation();
    const [stops, setStops] = useState<any[]>([]);
    const [origin, setOrigin] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
    const [detailStop, setDetailStop] = useState<any>(null);
    const [showMap, setShowMap] = useState(false);

    const handleFindNearby = async () => {
        try {
            setError(null);
            const coords = await requestPosition();
            setLoading(true);
            const response = await getNearbyStops(coords) as any;

            // Deduplicate stops by ID (just in case)
            const uniqueStops: any[] = Array.from(
                new Map(response.stops.map((stop: any) => [stop.id, stop])).values()
            );

            console.log('[DEBUG] API returned', response.stops.length, 'stops, unique:', uniqueStops.length);

            setStops(uniqueStops);
            setOrigin(response.origin);
            setShowMap(true);
            if (uniqueStops.length > 0) {
                setSelectedStopId(uniqueStops[0].id);
                onSelectStop?.(uniqueStops[0]);
            }
        } catch (err: any) {
            setError(err.message || 'Không thể xác định vị trí của bạn lúc này.');
            setShowMap(false);
        } finally {
            setLoading(false);
        }
    };

    const handleStopClick = async (stopId: string) => {
        setSelectedStopId(stopId);

        // Fetch walking route on-demand for this stop
        if (origin && stopId) {
            try {
                const selected = stops.find(s => s.id === stopId);
                if (selected) {
                    onSelectStop?.(selected);
                }

                const data = await getWalkingRoute(stopId, origin.lat, origin.lng) as any;

                // Update the stop with walking route data
                setStops(prevStops =>
                    prevStops.map(stop =>
                        stop.id === stopId
                            ? {
                                ...stop,
                                walkingRoute: data.walkingRoute,
                                walkingDistance: data.walkingDistance,
                                walkingDuration: data.walkingDuration
                            }
                            : stop
                    )
                );
            } catch (error) {
                console.error('Failed to fetch walking route:', error);
                // Silently fail - map will still show stops without route
            }
        }
    };

    const handleShowDetail = (stop: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setDetailStop(stop);
    };

    const handleCloseDetail = () => {
        setDetailStop(null);
    };

    return (
        <section className="bg-white overflow-hidden">
            <header className="border-b border-gray-200 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-semibold text-orange uppercase tracking-wider mb-1">Gợi ý gần bạn</p>
                        <h3 className="text-lg font-bold text-navy">Trạm đi bộ tới được</h3>
                        {stops.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapIcon className="h-3 w-3" />
                                <span>Xanh dương: Vị trí bạn · Đỏ: Trạm · Xanh lá: Đã chọn</span>
                            </p>
                        )}
                    </div>
                    <Button
                        variant="default"
                        onClick={handleFindNearby}
                        disabled={geoLoading || loading}
                        className="bg-navy hover:bg-navy/90"
                    >
                        {geoLoading || loading ? 'Đang tìm...' : 'Tìm trạm gần đây'}
                    </Button>
                </div>
            </header>

            {/* Full Width Container - No Padding */}
            <div>
                {error && <p className="text-sm text-red-500 px-6 py-4">{error}</p>}

                {/* Two Column Layout: Map Left (65%), List Right (35%) */}
                {showMap && origin && stops.length > 0 ? (
                    <div className="flex flex-col lg:flex-row min-h-[600px]">
                        {/* Left Column: Map (65% width on desktop) */}
                        <div className="w-full lg:w-[65%] flex-shrink-0 h-[400px] lg:h-[700px]">
                            <div className="sticky top-0 h-full overflow-hidden">
                                <WalkingRouteMap
                                    origin={origin}
                                    stops={stops}
                                    selectedStopId={selectedStopId || undefined}
                                    onStopSelect={handleStopClick}
                                />
                            </div>
                        </div>

                        {/* Right Column: Stops List (35% width, Scrollable) */}
                        <div className="w-full lg:w-[35%] flex-shrink-0 lg:max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 bg-gray-50">
                            <ul className="space-y-3 p-4">
                                {stops.map((stop) => {
                                    const isSelected = stop.id === selectedStopId;
                                    return (
                                        <li
                                            key={stop.id}
                                            className={`p-3 rounded-lg transition-all cursor-pointer border-2 ${isSelected
                                                ? 'bg-green-50 border-green-400 shadow-sm'
                                                : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                                }`}
                                            onClick={() => handleStopClick(stop.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Order Number Badge */}
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {stop.orderNumber || stop.sequenceNumber || 1}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Stop Name */}
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <MapPin className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-500'
                                                            }`} />
                                                        <strong className={`block truncate ${isSelected ? 'text-green-700' : 'text-gray-900'
                                                            }`}>
                                                            {stop.displayName || stop.name}
                                                        </strong>
                                                    </div>

                                                    {/* Distance Info */}
                                                    <p className="text-sm text-gray-500 mb-2">
                                                        {stop.distanceText} · {Math.round(stop.walkingDuration)} phút đi bộ
                                                    </p>

                                                    {/* Bus Routes */}
                                                    {stop.busRoutes && stop.busRoutes.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                            <p className="text-xs font-semibold text-gray-600 mb-1.5">
                                                                Xe buýt sắp đến:
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                {stop.busRoutes.map((route: any) => (
                                                                    <div
                                                                        key={route.id}
                                                                        className="flex items-center justify-between text-xs"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className="px-2 py-0.5 rounded font-semibold text-white"
                                                                                style={{ backgroundColor: route.color }}
                                                                            >
                                                                                {route.name}
                                                                            </span>
                                                                            {route.destinationName && (
                                                                                <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]" title={`Đi ${route.destinationName}`}>
                                                                                    → {route.destinationName}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            {route.nextArrivals && route.nextArrivals.slice(0, 2).map((time: number, idx: number) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    className={`font-medium ${idx === 0 ? 'text-green-600' : ''}`}
                                                                                >
                                                                                    {time}'
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Route Calculated Indicator */}
                                                    {stop.walkingRoute && (
                                                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                            <MapIcon className="h-3 w-3" />
                                                            <span>
                                                                {isSelected ? 'Đường đi đang hiển thị' : 'Click để xem đường đi'}
                                                            </span>
                                                        </p>
                                                    )}

                                                    {/* Action Button */}
                                                    <div className="mt-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => handleShowDetail(stop, e)}
                                                            className="w-full text-navy border-navy hover:bg-navy hover:text-white"
                                                        >
                                                            <Info className="h-4 w-4 mr-1" />
                                                            Xem chi tiết
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                ) : (
                    /* No Results / Initial State */
                    <div className="text-center text-gray-500 py-12 px-6">
                        <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Tìm trạm xe buýt gần bạn</p>
                        <p className="text-sm mt-1">Nhấn nút bên trên để xem các trạm đi bộ tới được (tối đa 1.5km)</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {detailStop && (
                <StopDetailModal
                    stop={detailStop}
                    onClose={handleCloseDetail}
                />
            )}
        </section>
    );
}
