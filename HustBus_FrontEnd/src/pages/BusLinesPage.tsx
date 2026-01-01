import { useState } from 'react';
import BusRouteSearch from '../components/BusRouteSearch.tsx';
import BusRouteDetail from '../components/BusRouteDetail.tsx';
import TransitTips from '../components/TransitTips.tsx';
import ReviewSection from '../components/ReviewSection.tsx';
import { BusFront } from 'lucide-react';

export default function BusLinesPage() {
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  return (
    <div className="w-full bg-cover bg-center relative" style={{ backgroundImage: "url('/assets/tet/tet-3.jpg')" }}>
      <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <div className="p-3 bg-orange rounded-full mr-4">
          <BusFront className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Tra cứu tuyến buýt</h1>
          <p className="text-white">Tìm kiếm và xem thông tin chi tiết các tuyến buýt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4 self-start h-fit">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-navy mb-4">Tìm kiếm tuyến</h2>
            <BusRouteSearch onSelect={setSelectedRoute} />
          </div>

          {selectedRoute && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-orange/5 border-b border-gray-100">
                <h3 className="font-semibold text-navy">Đánh giá tuyến</h3>
                <p className="text-xs text-gray-500">{selectedRoute.name}</p>
              </div>
              <div className="p-4">
                <ReviewSection
                  targetType="route"
                  targetId={selectedRoute.sampleId}
                  title=""
                />
              </div>
            </div>
          )}

          <TransitTips />
        </div>

        <div className="lg:col-span-8">
          {selectedRoute ? (
            <BusRouteDetail routeName={selectedRoute.name} />
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <BusFront className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-400">Chọn một tuyến để xem chi tiết</h3>
              <p className="text-sm text-gray-400 mt-1">Nhập số tuyến hoặc tên vào ô tìm kiếm bên trái</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
