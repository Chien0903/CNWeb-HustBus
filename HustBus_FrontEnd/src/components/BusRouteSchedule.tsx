import { useEffect, useState } from 'react';
import { getBusRouteSchedule } from '../services/api.ts';
import { Loader2 } from 'lucide-react';

interface Trip {
  trip_id: string;
  start_time: string;
  end_time: string;
}

interface BusRouteScheduleProps {
  routeId: string;
}

export default function BusRouteSchedule({ routeId }: BusRouteScheduleProps) {
  const [schedule, setSchedule] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBusRouteSchedule(routeId) as Trip[];
        // Sort by start_time just in case
        const sorted = data.sort((a: Trip, b: Trip) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        setSchedule(sorted);
      } catch (err) {
        console.error("Failed to fetch schedule", err);
        setError("Có lỗi khi tải lịch trình.");
      } finally {
        setLoading(false);
      }
    };

    if (routeId) {
      fetchSchedule();
    }
  }, [routeId]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (e) {
      return '--:--';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-orange" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm p-4">{error}</div>;
  }

  if (schedule.length === 0) {
    return <div className="text-gray-500 text-sm p-4">Không có lịch trình cho tuyến này.</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-navy">Lịch trình chạy</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {schedule.map((trip) => (
          <div
            key={trip.trip_id}
            className="bg-white border border-gray-200 rounded px-2 py-1 text-center text-sm hover:border-orange/50 transition-colors"
          >
            {formatTime(trip.start_time)}
          </div>
        ))}
      </div>
    </div>
  );
}
