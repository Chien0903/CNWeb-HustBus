/**
 * Kiểm tra xem tọa độ điểm đến có gần stop nào không
 */

const prisma = require("../config/prisma");

async function checkDestinationStop() {
  const destCoords = {
    lat: 21.0528997,
    lng: 105.7335701,
  };

  const testCoords = {
    lat: 21.052936,
    lng: 105.733674,
  };

  console.log("\n🔍 Kiểm tra tọa độ điểm đến...\n");
  console.log("═".repeat(80));

  try {
    // Tính khoảng cách từ tọa độ đến tất cả stops
    const allStops = await prisma.stops.findMany({});

    console.log(`📊 Tổng số stops: ${allStops.length}\n`);

    // Tính khoảng cách
    const R = 6371; // Earth radius in km
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };

    // Tìm stops gần tọa độ điểm đến
    const stopsWithDistance = allStops.map((stop) => ({
      ...stop,
      distance:
        calculateDistance(destCoords.lat, destCoords.lng, stop.lat, stop.lng) *
        1000, // meters
    }));

    // Sắp xếp theo khoảng cách
    stopsWithDistance.sort((a, b) => a.distance - b.distance);

    console.log(
      `📍 Tọa độ điểm đến từ frontend: ${destCoords.lat}, ${destCoords.lng}`
    );
    console.log(
      `📍 Tọa độ điểm đến test: ${testCoords.lat}, ${testCoords.lng}\n`
    );

    console.log("🔍 10 stops gần nhất:\n");
    stopsWithDistance.slice(0, 10).forEach((stop, index) => {
      console.log(`${index + 1}. ${stop.name} (${stop.id})`);
      console.log(`   Tọa độ: ${stop.lat}, ${stop.lng}`);
      console.log(`   Khoảng cách: ${stop.distance.toFixed(2)} m\n`);
    });

    // Kiểm tra stop 57_2_S43 (stop trong test)
    const testStop = await prisma.stops.findUnique({
      where: { id: "57_2_S43" },
    });

    if (testStop) {
      const distanceToTestStop =
        calculateDistance(
          destCoords.lat,
          destCoords.lng,
          testStop.lat,
          testStop.lng
        ) * 1000;

      console.log(`\n📍 Stop test (57_2_S43):`);
      console.log(`   Tọa độ: ${testStop.lat}, ${testStop.lng}`);
      console.log(
        `   Khoảng cách từ điểm đến frontend: ${distanceToTestStop.toFixed(
          2
        )} m\n`
      );

      if (distanceToTestStop > 1500) {
        console.log(
          `⚠️  Khoảng cách quá xa (>1.5km)! FastAPI có thể không tìm thấy routes.`
        );
      }
    }

    // Kiểm tra xem có trips nào đi qua stop gần nhất không
    const nearestStop = stopsWithDistance[0];
    console.log(
      `\n🚌 Kiểm tra trips đi qua stop gần nhất: ${nearestStop.name} (${nearestStop.id})\n`
    );

    const trips = await prisma.stop_times.findMany({
      where: { stop_id: nearestStop.id },
      include: { trips: true },
      take: 5,
    });

    console.log(`📊 Số trips đi qua stop này: ${trips.length}`);
    if (trips.length > 0) {
      console.log(`\n🚌 Một số trips:`);
      trips.slice(0, 5).forEach((st) => {
        console.log(`   - ${st.trip_id} (Route: ${st.trips.route_id})`);
      });
    }
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDestinationStop();
