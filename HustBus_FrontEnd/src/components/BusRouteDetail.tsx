import { useEffect, useState } from 'react';
import { getBusLineDetails } from '../services/api.ts';
import BusRouteSchedule from './BusRouteSchedule.tsx';
import StopPreviewCard from './StopPreviewCard.tsx';
import { Loader2, ArrowRightLeft, MapPin, Map as MapIcon, List } from 'lucide-react';
import { cn } from '../lib/utils.ts';

import BusRouteMap from './BusRouteMap.tsx';

interface BusRouteDetailProps {
  routeName: string;
}

export default function BusRouteDetail({ routeName }: BusRouteDetailProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'forward' | 'backward'>('forward');

  const [showMap, setShowMap] = useState(false);
  const [hoveredStop, setHoveredStop] = useState<{ id: string; name: string } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await getBusLineDetails(routeName);
        setDetails(data);
        // Reset to forward when new route is selected
        setActiveTab('forward');
      } catch (error) {
        console.error("Failed to fetch bus line details", error);
      } finally {
        setLoading(false);
      }
    };

    if (routeName) {
      fetchDetails();
    }
  }, [routeName]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-orange" /></div>;
  }

  if (!details) return null;

  const currentDirection = details.directions.find((d: any) => d.direction === activeTab);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-navy text-white">
        <h2 className="text-xl font-bold">{details.name}</h2>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('forward')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            activeTab === 'forward'
              ? "text-orange"
              : "text-gray-600 hover:text-navy hover:bg-gray-50"
          )}
        >
          Lượt đi
          {activeTab === 'forward' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('backward')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            activeTab === 'backward'
              ? "text-orange"
              : "text-gray-600 hover:text-navy hover:bg-gray-50"
          )}
        >
          Lượt về
          {activeTab === 'backward' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange" />
          )}
        </button>
      </div>

      <div className="p-4">
        {currentDirection ? (
          <>
            <div className="mb-4 flex items-center text-sm text-gray-500">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              <span>{currentDirection.headsign}</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-navy flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-orange" />
                  Danh sách trạm
                </h3>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showMap ? <List className="w-4 h-4 mr-1" /> : <MapIcon className="w-4 h-4 mr-1" />}
                  {showMap ? 'Xem danh sách' : 'Xem bản đồ'}
                </button>
              </div>

              <div className={cn("transition-all duration-300", showMap ? "flex flex-col lg:flex-row h-[500px] gap-4" : "")}>
                {showMap && (
                  <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
                    <BusRouteMap stops={currentDirection.stops} />
                  </div>
                )}

                <div className={cn(
                  showMap ? "w-full lg:w-[350px] shrink-0" : "",
                  "max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative"
                )}>
                  <div className="relative ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
                    {currentDirection.stops.map((stop: any) => (
                      <div
                        key={stop.id}
                        className="relative group cursor-pointer"
                        onMouseEnter={(e) => {
                          // Calculate position relative to container or viewport? 
                          // Let's try fixed position relative to viewport or simple absolute if container is relative.
                          // Simple approach: Store bounds, but since popup is fixed/absolute, we need care.
                          // We'll use a fixed strategy for the card in a portal or just absolute next to item.
                          // For simplicity, let's use the mouse enter target.
                          setHoveredStop(stop);
                          setHoverPosition({
                            top: e.currentTarget.offsetTop,
                            left: e.currentTarget.offsetLeft + 20 // Offset right
                          });
                        }}
                        onMouseLeave={() => setHoveredStop(null)}
                      >
                        <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 transition-colors ${hoveredStop?.id === stop.id ? 'bg-orange border-orange scale-125' : 'bg-white border-orange'}`} />
                        <p className={`text-sm font-medium transition-colors ${hoveredStop?.id === stop.id ? 'text-orange' : 'text-gray-800'}`}>{stop.name}</p>

                        {/* Inline Preview Card? Or distinct state? Using distinct state above list for z-index safety */}
                      </div>
                    ))}
                  </div>

                  {/* Render Preview Card Here (Absolute to scroll container) */}
                  {hoveredStop && hoverPosition && (
                    <StopPreviewCard
                      stopName={hoveredStop.name}
                      onClose={() => setHoveredStop(null)}
                      style={{
                        top: hoverPosition.top,
                        left: 50, // Fixed offset inside relative container
                        zIndex: 1000,
                        marginLeft: '50%' // Push towards center/right
                      }}
                    />
                  )}
                </div>
              </div>
            </div>



            <div className="border-t border-gray-100 pt-4">
              <BusRouteSchedule routeId={currentDirection.route_id} />
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">

            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu cho chiều này.
          </div>
        )}
      </div>
    </div>
  );
}
