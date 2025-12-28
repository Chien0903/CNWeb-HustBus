import React from 'react';
import { ShieldCheck, LampFloor, Accessibility, Armchair, Store } from 'lucide-react';

interface StopPreviewCardProps {
  stopName: string;
  onClose: () => void;
  style?: React.CSSProperties;
}

export default function StopPreviewCard({ stopName, style }: StopPreviewCardProps) {
  // varied data pool
  const SPOT_POOL = [
    { name: '☕ Highlight Coffee', dist: '50m' },
    { name: '🍜 Phở Bát Đàn', dist: '120m' },
    { name: '🌳 Công viên Thống Nhất', dist: '200m' },
    { name: '🏪 Circle K', dist: '10m' },
    { name: '🏧 Vietcombank ATM', dist: '30m' },
    { name: '🏫 Trường THCS', dist: '300m' },
    { name: '🏛️ Lịch sử', dist: '450m' },
    { name: '💊 Hiệu thuốc Pharmacity', dist: '80m' },
  ];

  // distinct randomization based on stop name
  const getRandomSpots = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const count = (Math.abs(hash) % 3) + 1; // 1 to 3 spots
    const spots = [];
    for (let i = 0; i < count; i++) {
      const index = Math.abs(hash + i * 13) % SPOT_POOL.length;
      spots.push(SPOT_POOL[index]);
    }
    return spots;
  };

  const selectedSpots = getRandomSpots(stopName);

  // Randomize amenities based on hash too for consistency (avoid flickering)
  const getAmenityStatus = (name: string, seed: number) => {
    let hash = 0;
    const str = name + seed;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash) % 10) > 3; // 70% chance true
  };

  const amenities = [
    { icon: <Armchair size={14} />, label: 'Khu vực chờ', available: getAmenityStatus(stopName, 1) },
    { icon: <LampFloor size={14} />, label: 'Đèn chiếu sáng', available: getAmenityStatus(stopName, 2) },
    { icon: <Accessibility size={14} />, label: 'Hỗ trợ người khuyết tật', available: getAmenityStatus(stopName, 3) },
    { icon: <Store size={14} />, label: 'Shop gần đây', available: getAmenityStatus(stopName, 4) },
  ];

  return (
    <div
      className="absolute z-[100] w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={style}
    >
      {/* Header Image (Placeholder - random based on hash for variety) */}
      <div className="h-32 bg-gray-200 relative">
        <img
          src={`https://images.unsplash.com/photo-${(Math.abs(stopName.length) % 2 === 0) ? '1570125909232-eb263c188f7e' : '1544620347-c4fd4a3d5960'}?auto=format&fit=crop&q=80&w=400&h=200`}
          alt="Bus Stop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 text-white">
          <h4 className="font-bold text-sm shadow-black drop-shadow-md">{stopName}</h4>
          {amenities[1].available && (
            <div className="flex items-center gap-1 text-[10px] bg-green-500/80 px-1.5 py-0.5 rounded-full w-fit mt-1">
              <ShieldCheck size={10} />
              <span>Safe Zone</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Tiện ích</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {amenities.map((item, i) => (
            <div key={i} className={`flex items-center gap-1.5 text-xs ${item.available ? 'text-navy' : 'text-gray-300'}`}>
              {item.icon}
              <span className={item.available ? 'font-medium' : 'line-through'}>{item.label}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Địa điểm gần đây</p>
        <div className="space-y-1">
          {selectedSpots.map((spot, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-navy bg-gray-50 p-1.5 rounded">
              <span className="font-medium truncate max-w-[150px]">{spot.name}</span>
              <span className="text-gray-400 text-[10px]">{spot.dist}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
