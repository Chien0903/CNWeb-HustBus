/**
 * Script để kiểm tra trạng thái import dữ liệu GTFS
 *
 * Usage:
 *   node scripts/check-import-status.js
 */

const prisma = require("../config/prisma");

async function checkImportStatus() {
  console.log("\n🔍 Kiểm tra trạng thái import dữ liệu GTFS\n");
  console.log("═".repeat(60));

  try {
    // Kiểm tra số lượng records trong mỗi bảng
    const routesCount = await prisma.routes.count();
    const stopsCount = await prisma.stops.count();
    const tripsCount = await prisma.trips.count();
    const stopTimesCount = await prisma.stop_times.count();

    console.log("\n📊 Số lượng records trong database:");
    console.log(`   🚌 Routes:     ${routesCount.toLocaleString()}`);
    console.log(`   🚏 Stops:      ${stopsCount.toLocaleString()}`);
    console.log(`   🔄 Trips:      ${tripsCount.toLocaleString()}`);
    console.log(`   ⏰ Stop Times: ${stopTimesCount.toLocaleString()}`);

    // Kiểm tra xem có dữ liệu không
    const hasData =
      routesCount > 0 || stopsCount > 0 || tripsCount > 0 || stopTimesCount > 0;

    if (!hasData) {
      console.log("\n⚠️  Database trống! Chưa có dữ liệu nào được import.");
      console.log("   Hãy chạy: node scripts/import-gtfs-to-db.js");
      await prisma.$disconnect();
      return;
    }

    // So sánh với số lượng mong đợi
    console.log("\n📈 So sánh với số lượng mong đợi:");

    const expected = {
      routes: 225,
      stops: 7700,
      trips: 13000,
      stopTimes: 434000,
    };

    const checkStatus = (actual, expected, name) => {
      const percentage =
        expected > 0 ? ((actual / expected) * 100).toFixed(1) : 0;
      if (actual >= expected * 0.9) {
        return `✅ ${name}: ${actual} (~${percentage}%)`;
      } else if (actual > 0) {
        return `⚠️  ${name}: ${actual} (~${percentage}% - thiếu dữ liệu)`;
      } else {
        return `❌ ${name}: ${actual} (chưa import)`;
      }
    };

    console.log(`   ${checkStatus(routesCount, expected.routes, "Routes")}`);
    console.log(`   ${checkStatus(stopsCount, expected.stops, "Stops")}`);
    console.log(`   ${checkStatus(tripsCount, expected.trips, "Trips")}`);
    console.log(
      `   ${checkStatus(stopTimesCount, expected.stopTimes, "Stop Times")}`
    );

    // Kiểm tra sample data
    console.log("\n📋 Sample data:");

    if (routesCount > 0) {
      const sampleRoute = await prisma.routes.findFirst();
      console.log(
        `   Routes: ${sampleRoute.id} - ${
          sampleRoute.long_name || sampleRoute.short_name
        }`
      );
    }

    if (stopsCount > 0) {
      const sampleStop = await prisma.stops.findFirst();
      console.log(`   Stops: ${sampleStop.id} - ${sampleStop.name}`);
    }

    if (tripsCount > 0) {
      const sampleTrip = await prisma.trips.findFirst();
      console.log(
        `   Trips: ${sampleTrip.trip_id} - Route: ${sampleTrip.route_id}`
      );
    }

    if (stopTimesCount > 0) {
      const sampleStopTime = await prisma.stop_times.findFirst({
        include: {
          stops: true,
          trips: true,
        },
      });
      if (sampleStopTime) {
        console.log(
          `   Stop Times: Trip ${sampleStopTime.trip_id}, Stop ${sampleStopTime.stop_id}, Sequence ${sampleStopTime.stop_sequence}`
        );
      }
    }

    // Kiểm tra foreign key relationships
    console.log("\n🔗 Kiểm tra relationships:");

    if (tripsCount > 0 && routesCount > 0) {
      const tripWithRoute = await prisma.trips.findFirst({
        include: { routes: true },
      });
      if (tripWithRoute && tripWithRoute.routes) {
        console.log(`   ✅ Trips → Routes: OK`);
      } else {
        console.log(`   ⚠️  Trips → Routes: Có trips không có route tương ứng`);
      }
    }

    if (stopTimesCount > 0 && stopsCount > 0 && tripsCount > 0) {
      const stopTimeWithRelations = await prisma.stop_times.findFirst({
        include: {
          stops: true,
          trips: true,
        },
      });
      if (
        stopTimeWithRelations &&
        stopTimeWithRelations.stops &&
        stopTimeWithRelations.trips
      ) {
        console.log(`   ✅ Stop Times → Stops & Trips: OK`);
      } else {
        console.log(
          `   ⚠️  Stop Times → Stops & Trips: Có stop_times không có stop/trip tương ứng`
        );
      }
    }

    // Tổng kết
    console.log("\n" + "═".repeat(60));

    const allImported =
      routesCount > 0 && stopsCount > 0 && tripsCount > 0 && stopTimesCount > 0;

    if (allImported) {
      console.log("✅ Import hoàn tất! Tất cả các bảng đã có dữ liệu.");
    } else {
      console.log("⚠️  Import chưa hoàn tất. Một số bảng còn thiếu dữ liệu.");
      console.log("\nCác bảng cần import:");
      if (routesCount === 0) console.log("   ❌ routes");
      if (stopsCount === 0) console.log("   ❌ stops");
      if (tripsCount === 0) console.log("   ❌ trips");
      if (stopTimesCount === 0) console.log("   ❌ stop_times");
    }

    console.log("");
  } catch (error) {
    console.error("\n❌ Lỗi khi kiểm tra:", error.message);
    if (error.code === "P1001") {
      console.error("   ⚠️  Không thể kết nối đến database.");
      console.error("   Kiểm tra lại DATABASE_URL trong file .env");
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run check
checkImportStatus();
