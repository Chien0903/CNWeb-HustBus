/**
 * Script để tìm các cặp stops có thể kết nối được (cùng một trip)
 * 
 * Usage:
 *   node scripts/find-connected-stops.js
 */

const prisma = require('../config/prisma');

async function findConnectedStops() {
  console.log('\n🔍 Tìm các cặp stops có thể kết nối...\n');
  console.log('═'.repeat(80));

  try {
    // Tìm các trip có nhiều stops và lấy các stops đầu và giữa
    const tripsWithStops = await prisma.$queryRaw`
      SELECT 
        t.trip_id,
        t.route_id,
        r.short_name,
        r.long_name,
        COUNT(st.stop_id) as stop_count
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN stop_times st ON t.trip_id = st.trip_id
      GROUP BY t.trip_id, t.route_id, r.short_name, r.long_name
      HAVING COUNT(st.stop_id) >= 5
      ORDER BY COUNT(st.stop_id) DESC
      LIMIT 10
    `;

    console.log(`📌 Tìm thấy ${tripsWithStops.length} trips có nhiều stops\n`);

    const examples = [];

    const seenRoutes = new Set();

    for (const trip of tripsWithStops) {
      // Bỏ qua nếu đã có ví dụ từ route này
      if (seenRoutes.has(trip.route_id)) continue;

      // Lấy stops của trip này với JOIN để lấy thông tin stop
      const stopTimes = await prisma.$queryRaw`
        SELECT 
          st.stop_sequence,
          st.departure_time,
          s.id as stop_id,
          s.name as stop_name,
          s.lat,
          s.lng
        FROM stop_times st
        JOIN stops s ON st.stop_id = s.id
        WHERE st.trip_id = ${trip.trip_id}
        ORDER BY st.stop_sequence ASC
      `;

      if (stopTimes.length < 5) continue;

      // Chọn điểm xuất phát (stop đầu) và điểm đến (stop ở 1/3 quãng đường)
      const fromIndex = 0;
      const toIndex = Math.min(Math.floor(stopTimes.length / 3), stopTimes.length - 1);

      const fromStop = stopTimes[fromIndex];
      const toStop = stopTimes[toIndex];

      // Tính khoảng cách
      const R = 6371;
      const dLat = ((toStop.lat - fromStop.lat) * Math.PI) / 180;
      const dLon = ((toStop.lng - fromStop.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((fromStop.lat * Math.PI) / 180) *
          Math.cos((toStop.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Format thời gian
      const formatTime = (time) => {
        if (!time) return '08:00:00';
        if (typeof time === 'string') return time.substring(0, 8);
        if (time instanceof Date) {
          const hours = String(time.getHours()).padStart(2, '0');
          const minutes = String(time.getMinutes()).padStart(2, '0');
          const seconds = String(time.getSeconds()).padStart(2, '0');
          return `${hours}:${minutes}:${seconds}`;
        }
        return '08:00:00';
      };

      const departureTimeStr = formatTime(fromStop.departure_time);

      examples.push({
        route: trip.route_id,
        routeName: trip.long_name || trip.short_name || trip.route_id,
        from: {
          id: fromStop.stop_id,
          name: fromStop.stop_name,
          lat: parseFloat(fromStop.lat),
          lng: parseFloat(fromStop.lng)
        },
        to: {
          id: toStop.stop_id,
          name: toStop.stop_name,
          lat: parseFloat(toStop.lat),
          lng: parseFloat(toStop.lng)
        },
        distance: distance,
        time: departureTimeStr,
        tripId: trip.trip_id
      });

      seenRoutes.add(trip.route_id);

      // Chỉ lấy 5 ví dụ từ các route khác nhau
      if (examples.length >= 5) break;
    }

    // Hiển thị kết quả
    console.log('📋 CÁC CẶP ĐỊA ĐIỂM CÓ THỂ KẾT NỐI:\n');

    examples.forEach((ex, index) => {
      console.log(`\n${'═'.repeat(80)}`);
      console.log(`\n📍 VÍ DỤ ${index + 1}: Tuyến ${ex.route} - ${ex.routeName}`);
      console.log(`\n🚌 Điểm xuất phát:`);
      console.log(`   Tên: ${ex.from.name}`);
      console.log(`   Stop ID: ${ex.from.id}`);
      console.log(`   Tọa độ: ${ex.from.lat}, ${ex.from.lng}`);
      
      console.log(`\n🎯 Điểm đến:`);
      console.log(`   Tên: ${ex.to.name}`);
      console.log(`   Stop ID: ${ex.to.id}`);
      console.log(`   Tọa độ: ${ex.to.lat}, ${ex.to.lng}`);
      
      console.log(`\n📏 Khoảng cách: ${ex.distance.toFixed(2)} km`);
      console.log(`⏰ Thời gian khởi hành: ${ex.time}`);
      
      console.log(`\n📝 Request JSON:`);
      console.log(JSON.stringify({
        from: {
          lat: ex.from.lat,
          lng: ex.from.lng
        },
        to: {
          lat: ex.to.lat,
          lng: ex.to.lng
        },
        time: ex.time
      }, null, 2));
    });

    console.log(`\n${'═'.repeat(80)}`);
    console.log('\n✅ Hoàn tất! Bạn có thể copy các tọa độ trên để test.\n');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
findConnectedStops();

