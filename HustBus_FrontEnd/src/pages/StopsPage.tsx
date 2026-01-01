import { useState } from 'react';
import NearbyStops from '../components/NearbyStops.tsx';
import ReviewSection from '../components/ReviewSection.tsx';
import { MapPin } from 'lucide-react';

export default function StopsPage() {
  const [selectedStop, setSelectedStop] = useState<any>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl ">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red/10 rounded-full">
          <MapPin className="h-6 w-6 text-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Tra cứu & đánh giá trạm</h1>
          <p className="text-gray-500 text-sm">Tìm trạm gần bạn và gửi phản hồi về tình trạng hoạt động.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NearbyStops onSelectStop={setSelectedStop} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          {!selectedStop ? (
            <p className="text-gray-500 text-center py-10">
              Chọn một trạm để xem và gửi đánh giá.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm font-semibold text-red uppercase tracking-wider">Đang đánh giá</p>
                <h2 className="text-xl font-bold text-navy">{selectedStop.name}</h2>
                <p className="text-sm text-gray-500">{selectedStop.distanceText} · {Math.round(selectedStop.walkingDuration)} phút đi bộ</p>
              </div>
              <ReviewSection
                targetType="stop"
                targetId={selectedStop.id}
                title="Đánh giá tình trạng trạm"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
