/**
 * Script để sửa file trips.txt - xóa các dòng trống hoặc không hợp lệ
 *
 * Usage:
 *   node scripts/fix-trips-file.js
 */

const fs = require("fs");
const path = require("path");

const tripsFile = path.join(__dirname, "../data/gtfs/trips.txt");
const tripsFileBackup = path.join(__dirname, "../data/gtfs/trips.txt.backup");

async function fixTripsFile() {
  console.log("🔧 Đang sửa file trips.txt...\n");

  try {
    // Backup file gốc
    console.log("📦 Đang backup file gốc...");
    const content = fs.readFileSync(tripsFile, "utf8");
    fs.writeFileSync(tripsFileBackup, content, "utf8");
    console.log(`✅ Đã backup vào: ${tripsFileBackup}\n`);

    // Đọc file và xử lý
    const lines = content.split("\n");
    const header = lines[0];
    const dataLines = lines.slice(1);

    console.log(`📊 Tổng số dòng (bao gồm header): ${lines.length}`);
    console.log(`📊 Số dòng dữ liệu: ${dataLines.length}\n`);

    // Filter các dòng hợp lệ (có ít nhất route_id và trip_id)
    const validLines = dataLines.filter((line, index) => {
      const trimmed = line.trim();

      // Bỏ qua dòng trống hoàn toàn
      if (trimmed === "") {
        console.log(`⚠️  Bỏ qua dòng trống ở vị trí ${index + 2}`);
        return false;
      }

      // Kiểm tra số cột (phải có ít nhất 3 cột: route_id, service_id, trip_id)
      const columns = trimmed.split(",");
      if (columns.length < 3) {
        console.log(
          `⚠️  Bỏ qua dòng ${index + 2} (thiếu cột): ${trimmed.substring(
            0,
            50
          )}...`
        );
        return false;
      }

      // Kiểm tra route_id và trip_id không được rỗng
      const routeId = columns[0]?.trim();
      const tripId = columns[2]?.trim();

      if (!routeId || !tripId) {
        console.log(
          `⚠️  Bỏ qua dòng ${
            index + 2
          } (thiếu route_id hoặc trip_id): ${trimmed.substring(0, 50)}...`
        );
        return false;
      }

      return true;
    });

    console.log(`\n✅ Số dòng hợp lệ sau khi filter: ${validLines.length}`);
    console.log(
      `❌ Số dòng đã bỏ qua: ${dataLines.length - validLines.length}\n`
    );

    // Ghi lại file
    const newContent = header + "\n" + validLines.join("\n");
    fs.writeFileSync(tripsFile, newContent, "utf8");

    console.log("✅ Đã sửa file trips.txt thành công!");
    console.log(`📁 File backup: ${tripsFileBackup}\n`);
  } catch (error) {
    console.error("❌ Lỗi khi sửa file:", error.message);
    process.exit(1);
  }
}

// Run
fixTripsFile();
