/**
 * Script để tìm ví dụ về tuyến phù hợp giữa 2 điểm
 *
 * Usage:
 *   node scripts/find-example-route.js
 */

const prisma = require("../config/prisma");

async function findExampleRoute() {
  console.log("\n🔍 Tìm ví dụ về tuyến phù hợp...\n");
  console.log("═".repeat(80));

  try {
    // Tìm một trip có nhiều stops
    const tripWithStops = await prisma.$queryRaw`
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
      LIMIT 1
    `;

    if (!tripWithStops || tripWithStops.length === 0) {
      console.log("❌ Không tìm thấy trip nào có đủ stops");
      await prisma.$disconnect();
      return;
    }

    const trip = tripWithStops[0];
    console.log(`\n📌 Tìm thấy trip: ${trip.trip_id}`);
    console.log(
      `   Route: ${trip.route_id} - ${trip.long_name || trip.short_name}`
    );
    console.log(`   Số stops: ${trip.stop_count}\n`);

    // Lấy các stops của trip này
    const stopTimes = await prisma.stop_times.findMany({
      where: {
        trip_id: trip.trip_id,
      },
      include: {
        stops: true,
      },
      orderBy: {
        stop_sequence: "asc",
      },
    });

    if (stopTimes.length < 2) {
      console.log("❌ Trip không có đủ stops");
      await prisma.$disconnect();
      return;
    }

    // Chọn điểm xuất phát và điểm đến (cách nhau ít nhất 3 stops)
    const fromIndex = 0;
    const toIndex = Math.min(3, stopTimes.length - 1);

    const fromStop = stopTimes[fromIndex].stops;
    const toStop = stopTimes[toIndex].stops;

    console.log("📍 Điểm xuất phát:");
    console.log(`   Stop ID: ${fromStop.id}`);
    console.log(`   Tên: ${fromStop.name}`);
    console.log(`   Tọa độ: ${fromStop.lat}, ${fromStop.lng}`);
    console.log(`   Sequence: ${stopTimes[fromIndex].stop_sequence}`);

    console.log("\n📍 Điểm đến:");
    console.log(`   Stop ID: ${toStop.id}`);
    console.log(`   Tên: ${toStop.name}`);
    console.log(`   Tọa độ: ${toStop.lat}, ${toStop.lng}`);
    console.log(`   Sequence: ${stopTimes[toIndex].stop_sequence}`);

    // Tính khoảng cách
    const R = 6371; // Earth radius in km
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

    console.log(`\n📏 Khoảng cách: ${distance.toFixed(2)} km`);

    // Lấy thời gian khởi hành và format đúng
    const formatTime = (time) => {
      if (!time) return "08:00:00";
      if (typeof time === "string") return time.substring(0, 8);
      if (time instanceof Date) {
        const hours = String(time.getHours()).padStart(2, "0");
        const minutes = String(time.getMinutes()).padStart(2, "0");
        const seconds = String(time.getSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
      }
      return "08:00:00";
    };

    const departureTime = stopTimes[fromIndex].departure_time;
    const arrivalTime = stopTimes[toIndex].arrival_time;
    const departureTimeStr = formatTime(departureTime);
    const arrivalTimeStr = formatTime(arrivalTime);

    console.log(`\n⏰ Thời gian:`);
    console.log(`   Khởi hành: ${departureTimeStr}`);
    console.log(`   Đến nơi: ${arrivalTimeStr}`);

    // Ví dụ request API
    console.log("\n" + "═".repeat(80));
    console.log("📝 VÍ DỤ REQUEST API:\n");

    console.log("POST /api/path/find");
    console.log("Content-Type: application/json\n");
    console.log(
      JSON.stringify(
        {
          from: {
            lat: fromStop.lat,
            lng: fromStop.lng,
          },
          to: {
            lat: toStop.lat,
            lng: toStop.lng,
          },
          time: departureTimeStr,
        },
        null,
        2
      )
    );

    console.log("\n" + "═".repeat(80));
    console.log("\n📝 VÍ DỤ CURL COMMAND:\n");

    const curlCommand = `curl -X POST http://localhost:4000/api/path/find \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "from": {
      "lat": ${fromStop.lat},
      "lng": ${fromStop.lng}
    },
    "to": {
      "lat": ${toStop.lat},
      "lng": ${toStop.lng}
    },
    "time": "${departureTimeStr}"
  }'`;

    console.log(curlCommand);

    console.log("\n" + "═".repeat(80));
    console.log("\n📝 VÍ DỤ VỚI TỌA ĐỘ GẦN STOPS:\n");

    // Thêm một chút offset để mô phỏng tọa độ người dùng gần stops
    const fromLatOffset = fromStop.lat + 0.001; // ~100m về phía bắc
    const fromLngOffset = fromStop.lng + 0.001; // ~100m về phía đông
    const toLatOffset = toStop.lat - 0.001; // ~100m về phía nam
    const toLngOffset = toStop.lng - 0.001; // ~100m về phía tây

    console.log("POST /api/path/find");
    console.log(
      JSON.stringify(
        {
          from: {
            lat: fromLatOffset,
            lng: fromLngOffset,
          },
          to: {
            lat: toLatOffset,
            lng: toLngOffset,
          },
          time: departureTimeStr,
        },
        null,
        2
      )
    );

    console.log("\n" + "═".repeat(80));
    console.log("\n✅ Hoàn tất!\n");
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
findExampleRoute();
