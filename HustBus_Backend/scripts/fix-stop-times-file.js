/**
 * Script để sửa file stop_times.txt - xóa các dòng trống hoặc không hợp lệ
 *
 * Usage:
 *   node scripts/fix-stop-times-file.js
 */

const fs = require("fs");
const path = require("path");

const stopTimesFile = path.join(
  __dirname,
  "../data/gtfs/stop_times.txt"
);
const stopTimesFileBackup = path.join(
  __dirname,
  "../data/gtfs/stop_times.txt.backup"
);

async function fixStopTimesFile() {
  console.log("🔧 Đang sửa file stop_times.txt...\n");

  try {
    // Backup file gốc
    console.log("📦 Đang backup file gốc...");
    const content = fs.readFileSync(stopTimesFile, "utf8");
    fs.writeFileSync(stopTimesFileBackup, content, "utf8");
    console.log(`✅ Đã backup vào: ${stopTimesFileBackup}\n`);

    // Đọc file và xử lý
    const lines = content.split("\n");
    const header = lines[0];
    const dataLines = lines.slice(1);

    console.log(`📊 Tổng số dòng (bao gồm header): ${lines.length}`);
    console.log(`📊 Số dòng dữ liệu: ${dataLines.length}\n`);

    // Filter các dòng hợp lệ (có ít nhất trip_id, stop_id, stop_sequence)
    const validLines = dataLines.filter((line, index) => {
      const trimmed = line.trim();

      // Bỏ qua dòng trống hoàn toàn
      if (trimmed === "") {
        if ((index + 1) % 10000 === 0 || index < 10) {
          console.log(`⚠️  Bỏ qua dòng trống ở vị trí ${index + 2}`);
        }
        return false;
      }

      // Kiểm tra số cột (phải có ít nhất 5 cột: trip_id, arrival_time, departure_time, stop_id, stop_sequence)
      const columns = trimmed.split(",");
      if (columns.length < 5) {
        if ((index + 1) % 10000 === 0 || index < 10) {
          console.log(
            `⚠️  Bỏ qua dòng ${index + 2} (thiếu cột): ${trimmed.substring(
              0,
              50
            )}...`
          );
        }
        return false;
      }

      // Kiểm tra trip_id, stop_id và stop_sequence không được rỗng
      const tripId = columns[0]?.trim();
      const stopId = columns[3]?.trim();
      const stopSequence = columns[4]?.trim();

      if (!tripId || !stopId || !stopSequence) {
        if ((index + 1) % 10000 === 0 || index < 10) {
          console.log(
            `⚠️  Bỏ qua dòng ${
              index + 2
            } (thiếu trip_id, stop_id hoặc stop_sequence): ${trimmed.substring(
              0,
              50
            )}...`
          );
        }
        return false;
      }

      // Kiểm tra stop_sequence phải là số
      if (isNaN(parseInt(stopSequence))) {
        if ((index + 1) % 10000 === 0 || index < 10) {
          console.log(
            `⚠️  Bỏ qua dòng ${index + 2} (stop_sequence không phải số): ${trimmed.substring(
              0,
              50
            )}...`
          );
        }
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
    fs.writeFileSync(stopTimesFile, newContent, "utf8");

    console.log("✅ Đã sửa file stop_times.txt thành công!");
    console.log(`📁 File backup: ${stopTimesFileBackup}\n`);
  } catch (error) {
    console.error("❌ Lỗi khi sửa file:", error.message);
    process.exit(1);
  }
}

// Run
fixStopTimesFile();

