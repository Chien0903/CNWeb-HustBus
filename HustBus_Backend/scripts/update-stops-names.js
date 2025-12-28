/**
 * Script để cập nhật tên stops từ stops-enriched.txt vào database
 *
 * Usage:
 *   node scripts/update-stops-names.js
 */

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/sync").parse;
const prisma = require("../config/prisma");

async function updateStopsNames() {
  console.log("\n🔄 Cập nhật tên stops từ stops-enriched.txt...\n");
  console.log("═".repeat(80));

  try {
    // Đọc file stops-enriched.txt
    const enrichedFile = path.join(
      __dirname,
      "../data/gtfs/stops-enriched.txt"
    );

    if (!fs.existsSync(enrichedFile)) {
      console.error(`❌ File không tồn tại: ${enrichedFile}`);
      await prisma.$disconnect();
      return;
    }

    console.log(`📖 Đọc file: ${enrichedFile}`);
    const content = fs.readFileSync(enrichedFile, "utf8");
    const enrichedStops = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`✅ Đọc được ${enrichedStops.length} stops từ file enriched\n`);

    // Đếm số stops cần update
    let updateCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    console.log("🔄 Bắt đầu cập nhật...\n");

    for (let i = 0; i < enrichedStops.length; i++) {
      const enrichedStop = enrichedStops[i];
      const stopId = enrichedStop.stop_id;
      const enrichedName = enrichedStop.stop_name;

      try {
        // Kiểm tra stop có tồn tại không
        const existingStop = await prisma.stops.findUnique({
          where: { id: stopId },
        });

        if (!existingStop) {
          console.log(
            `⚠️  Stop ${stopId} không tồn tại trong database, bỏ qua`
          );
          skipCount++;
          continue;
        }

        // Chỉ update nếu tên khác nhau
        if (existingStop.name === enrichedName) {
          skipCount++;
          continue;
        }

        // Update tên stop
        await prisma.stops.update({
          where: { id: stopId },
          data: { name: enrichedName },
        });

        updateCount++;

        if (updateCount % 100 === 0) {
          console.log(`   ✅ Đã cập nhật ${updateCount} stops...`);
        }
      } catch (error) {
        console.error(`❌ Lỗi khi cập nhật stop ${stopId}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n${"═".repeat(80)}`);
    console.log("\n✅ Hoàn tất cập nhật!\n");
    console.log("📊 Thống kê:");
    console.log(`   - Tổng stops trong file: ${enrichedStops.length}`);
    console.log(`   - Đã cập nhật: ${updateCount}`);
    console.log(
      `   - Bỏ qua (không thay đổi hoặc không tồn tại): ${skipCount}`
    );
    console.log(`   - Lỗi: ${errorCount}\n`);
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
updateStopsNames();
