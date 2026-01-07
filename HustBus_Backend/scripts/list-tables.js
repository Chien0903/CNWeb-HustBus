/**
 * Script để liệt kê tất cả các bảng trong database và số lượng records
 *
 * Usage:
 *   node scripts/list-tables.js
 */

const prisma = require("../config/prisma");

async function listTables() {
  console.log("\n📊 DANH SÁCH CÁC BẢNG TRONG DATABASE\n");
  console.log("═".repeat(80));

  try {
    // Lấy danh sách tất cả các bảng từ Prisma schema
    const tables = [
      { name: "routes", model: prisma.routes, description: "Tuyến đường" },
      { name: "stops", model: prisma.stops, description: "Điểm dừng" },
      { name: "trips", model: prisma.trips, description: "Chuyến đi" },
      {
        name: "stop_times",
        model: prisma.stop_times,
        description: "Thời gian dừng tại các điểm",
      },
      { name: "users", model: prisma.users, description: "Người dùng" },
      {
        name: "reviews",
        model: prisma.reviews,
        description: "Đánh giá",
      },
      {
        name: "saved_routes",
        model: prisma.saved_routes,
        description: "Lộ trình đã lưu",
      },
    ];

    console.log("\n📋 Thông tin các bảng:\n");

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(
          `   📌 ${table.name.padEnd(20)} │ ${count
            .toLocaleString()
            .padStart(10)} records │ ${table.description}`
        );
      } catch (error) {
        console.log(
          `   ❌ ${table.name.padEnd(20)} │ Lỗi: ${error.message}`
        );
      }
    }

    console.log("\n" + "═".repeat(80));

    // Tổng kết
    let totalRecords = 0;
    const counts = {};
    for (const table of tables) {
      try {
        const count = await table.model.count();
        counts[table.name] = count;
        totalRecords += count;
      } catch (error) {
        counts[table.name] = 0;
      }
    }

    console.log("\n📈 Tổng kết:\n");
    console.log(`   Tổng số bảng: ${tables.length}`);
    console.log(`   Tổng số records: ${totalRecords.toLocaleString()}\n`);

    // Phân loại bảng
    console.log("📂 Phân loại:\n");
    console.log("   🚌 Bảng GTFS (Dữ liệu giao thông công cộng):");
    console.log(
      `      - routes:      ${counts.routes.toLocaleString().padStart(10)} records`
    );
    console.log(
      `      - stops:       ${counts.stops.toLocaleString().padStart(10)} records`
    );
    console.log(
      `      - trips:       ${counts.trips.toLocaleString().padStart(10)} records`
    );
    console.log(
      `      - stop_times:  ${counts.stop_times.toLocaleString().padStart(10)} records`
    );

    console.log("\n   👥 Bảng người dùng:");
    console.log(
      `      - users:       ${counts.users.toLocaleString().padStart(10)} records`
    );
    console.log(
      `      - reviews:     ${counts.reviews.toLocaleString().padStart(10)} records`
    );
    console.log(
      `      - saved_routes: ${counts.saved_routes.toLocaleString().padStart(10)} records`
    );

    // Kiểm tra trạng thái import GTFS
    const gtfsTables = ["routes", "stops", "trips", "stop_times"];
    const gtfsCounts = gtfsTables.map((t) => counts[t] || 0);
    const allImported = gtfsCounts.every((count) => count > 0);
    const anyImported = gtfsCounts.some((count) => count > 0);

    console.log("\n" + "═".repeat(80));
    if (allImported) {
      console.log("✅ Tất cả các bảng GTFS đã có dữ liệu!");
    } else if (anyImported) {
      console.log("⚠️  Một số bảng GTFS chưa có dữ liệu:");
      gtfsTables.forEach((table) => {
        if (counts[table] === 0) {
          console.log(`   ❌ ${table}`);
        }
      });
    } else {
      console.log("⚠️  Chưa có dữ liệu GTFS nào được import.");
      console.log("   Chạy: node scripts/import-gtfs-to-db.js");
    }

    console.log("");

    // Hiển thị sample data từ mỗi bảng có dữ liệu
    console.log("📋 Sample data từ các bảng:\n");
    for (const table of tables) {
      if (counts[table.name] > 0) {
        try {
          const sample = await table.model.findFirst();
          if (sample) {
            console.log(`   ${table.name}:`);
            console.log(`      ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
            console.log("");
          }
        } catch (error) {
          // Ignore errors khi lấy sample
        }
      }
    }

  } catch (error) {
    console.error("\n❌ Lỗi khi liệt kê bảng:", error.message);
    if (error.code === "P1001") {
      console.error("   ⚠️  Không thể kết nối đến database.");
      console.error("   Kiểm tra lại DATABASE_URL trong file .env");
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run
listTables();

