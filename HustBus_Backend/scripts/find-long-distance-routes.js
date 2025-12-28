/**
 * Script để tìm các cặp địa điểm xa nhau để test
 */

const prisma = require('../config/prisma');
const { findNearestStops } = require('../utils/findpathUtils');
const axios = require('axios');
const config = require('../config/env.config');

async function findLongDistanceRoutes() {
  console.log('\n🔍 Tìm các cặp địa điểm xa nhau để test...\n');
  console.log('═'.repeat(80));

  try {
    // Tìm các trip có nhiều stops (khoảng cách dài)
    const trips = await prisma.$queryRaw`
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
      HAVING COUNT(st.stop_id) >= 30
      ORDER BY COUNT(st.stop_id) DESC
      LIMIT 10
    `;

    console.log(`📌 Tìm thấy ${trips.length} trips có nhiều stops (khoảng cách dài)\n`);

    const apiUrl = config.getRoutingApiUrl(config.externalApis.routingService.endpoints.findRoute);
    const examples = [];

    for (const trip of trips) {
      // Lấy stops của trip
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

      if (stopTimes.length < 20) continue;

      // Chọn điểm xuất phát (đầu) và điểm đến (cuối hoặc 2/3 quãng đường)
      const fromIndex = 0;
      const toIndex = Math.min(Math.floor(stopTimes.length * 0.7), stopTimes.length - 1);

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

      // Chỉ lấy các cặp có khoảng cách >= 10km
      if (distance < 10) continue;

      // Format thời gian
      const formatTime = (time) => {
        if (!time) return null;
        if (typeof time === 'string') return time.substring(0, 8);
        if (time instanceof Date) {
          const hours = String(time.getHours()).padStart(2, '0');
          const minutes = String(time.getMinutes()).padStart(2, '0');
          const seconds = String(time.getSeconds()).padStart(2, '0');
          return `${hours}:${minutes}:${seconds}`;
        }
        return null;
      };

      const departureTime = formatTime(fromStop.departure_time);
      if (!departureTime) continue;

      // Tìm stops gần nhất từ tọa độ
      const nearestStops = await findNearestStops(
        parseFloat(fromStop.lat),
        parseFloat(fromStop.lng),
        1
      );

      if (nearestStops.length === 0) continue;

      const nearestStop = nearestStops[0];

      // Test API
      try {
        const response = await axios.get(apiUrl, {
          params: {
            lat_from: nearestStop.lat,
            lon_from: nearestStop.lng,
            lat_to: parseFloat(toStop.lat),
            lon_to: parseFloat(toStop.lng),
            time: departureTime,
            max_transfers: 3
          },
          timeout: 15000
        });

        if (response.data && response.data.routes && response.data.routes.length > 0) {
          examples.push({
            route: trip.route_id,
            routeName: trip.long_name || trip.short_name || trip.route_id,
            from: {
              stopId: fromStop.stop_id,
              stopName: fromStop.stop_name,
              lat: parseFloat(fromStop.lat),
              lng: parseFloat(fromStop.lng),
              nearestStopId: nearestStop.id,
              nearestStopName: nearestStop.name,
              nearestStopLat: nearestStop.lat,
              nearestStopLng: nearestStop.lng
            },
            to: {
              stopId: toStop.stop_id,
              stopName: toStop.stop_name,
              lat: parseFloat(toStop.lat),
              lng: parseFloat(toStop.lng)
            },
            distance: distance,
            time: departureTime,
            routesFound: response.data.routes.length,
            totalStops: stopTimes.length
          });
        }
      } catch (error) {
        // Skip errors
      }

      if (examples.length >= 5) break;
    }

    // Sắp xếp theo khoảng cách (xa nhất trước)
    examples.sort((a, b) => b.distance - a.distance);

    // Hiển thị kết quả
    console.log(`\n✅ Tìm thấy ${examples.length} ví dụ khoảng cách xa (>= 10km):\n`);

    examples.forEach((ex, index) => {
      console.log(`${'═'.repeat(80)}`);
      console.log(`\n📍 VÍ DỤ ${index + 1}: Tuyến ${ex.route} - ${ex.routeName}`);
      console.log(`\n📏 Khoảng cách: ${ex.distance.toFixed(2)} km`);
      console.log(`📊 Số stops trong trip: ${ex.totalStops}`);
      console.log(`🚌 Số lộ trình tìm thấy: ${ex.routesFound}`);
      
      console.log(`\n🚌 Điểm xuất phát:`);
      console.log(`   Stop gốc: ${ex.from.stopName} (${ex.from.stopId})`);
      console.log(`   Tọa độ gốc: ${ex.from.lat}, ${ex.from.lng}`);
      console.log(`   Stop gần nhất: ${ex.from.nearestStopName} (${ex.from.nearestStopId})`);
      console.log(`   Tọa độ stop gần nhất: ${ex.from.nearestStopLat}, ${ex.from.nearestStopLng}`);
      
      console.log(`\n🎯 Điểm đến:`);
      console.log(`   Stop: ${ex.to.stopName} (${ex.to.stopId})`);
      console.log(`   Tọa độ: ${ex.to.lat}, ${ex.to.lng}`);
      
      console.log(`\n⏰ Thời gian khởi hành: ${ex.time}`);
      
      console.log(`\n📝 Request JSON:`);
      console.log(JSON.stringify({
        from: {
          lat: ex.from.nearestStopLat,
          lng: ex.from.nearestStopLng
        },
        to: {
          lat: ex.to.lat,
          lng: ex.to.lng
        },
        time: ex.time
      }, null, 2));

      console.log(`\n📝 Request JSON (dùng tọa độ gốc):`);
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
    console.log('\n✅ Hoàn tất!\n');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
findLongDistanceRoutes();

