/**
 * Script để generate SQL COPY commands cho pgAdmin
 *
 * Usage:
 *   node scripts/generate-pgadmin-copy-sql.js
 *
 * Script này sẽ tạo file SQL với các lệnh COPY để import GTFS vào PostgreSQL
 * Bạn có thể copy và paste vào pgAdmin Query Tool
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const GTFS_DIR = path.join(__dirname, "../data/gtfs");
const OUTPUT_FILE = path.join(__dirname, "../pgadmin-import-gtfs.sql");

// Lấy đường dẫn tuyệt đối của file GTFS
function getAbsolutePath(filename) {
  const filePath = path.join(GTFS_DIR, filename);
  const absolutePath = path.resolve(filePath);

  // Convert to Windows format nếu cần
  if (os.platform() === "win32") {
    return absolutePath.replace(/\//g, "\\");
  }
  return absolutePath;
}

function generateCopySQL() {
  const stopsPath = getAbsolutePath("stops.txt");
  const routesPath = getAbsolutePath("routes.txt");
  const tripsPath = getAbsolutePath("trips.txt");
  const stopTimesPath = getAbsolutePath("stop_times.txt");

  const sql = `
-- ========================================
-- SQL Script để Import GTFS vào PostgreSQL bằng pgAdmin
-- ========================================
-- 
-- Hướng dẫn:
-- 1. Mở pgAdmin
-- 2. Kết nối vào PostgreSQL server local
-- 3. Chọn database 'transitdb'
-- 4. Mở Query Tool (Right-click database → Query Tool)
-- 5. Copy và paste từng phần SQL này vào Query Tool
-- 6. Chạy từng phần theo thứ tự
--
-- Lưu ý: Đảm bảo đường dẫn file đúng với máy của bạn!
-- Nếu đường dẫn khác, sửa lại các đường dẫn trong lệnh \\COPY
--
-- ========================================
-- BƯỚC 1: Import STOPS
-- ========================================

-- Xóa dữ liệu cũ (nếu cần)
TRUNCATE stop_times CASCADE;
TRUNCATE trips CASCADE;
TRUNCATE stops CASCADE;

-- Tạo temp table để import đầy đủ dữ liệu từ GTFS
CREATE TEMP TABLE temp_stops (
    stop_id VARCHAR(50),
    stop_name TEXT,
    stop_desc TEXT,
    stop_lat DOUBLE PRECISION,
    stop_lon DOUBLE PRECISION,
    zone_id TEXT,
    stop_url TEXT
);

-- Import vào temp table
\\COPY temp_stops FROM '${stopsPath}' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Insert vào bảng chính với mapping và validation
INSERT INTO stops (id, name, lat, lng, type)
SELECT 
    stop_id,
    COALESCE(NULLIF(stop_name, ''), NULLIF(stop_desc, ''), 'Unknown Stop'),
    stop_lat,
    stop_lon,
    'bus'  -- Default type
FROM temp_stops
WHERE stop_lat IS NOT NULL 
  AND stop_lon IS NOT NULL 
  AND stop_lat != 0 
  AND stop_lon != 0
  AND stop_id IS NOT NULL;

-- Xóa temp table
DROP TABLE temp_stops;

-- Kiểm tra kết quả
SELECT COUNT(*) as stops_count FROM stops;
SELECT * FROM stops LIMIT 5;

-- ========================================
-- BƯỚC 2: Import ROUTES
-- ========================================

-- Tạo temp table cho routes
CREATE TEMP TABLE temp_routes (
    route_id VARCHAR(50),
    agency_id TEXT,
    route_short_name TEXT,
    route_long_name TEXT,
    route_desc TEXT,
    route_type INT,
    route_url TEXT,
    route_color TEXT,
    route_text_color TEXT
);

-- Import vào temp table
\\COPY temp_routes FROM '${routesPath}' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Insert vào bảng chính với mapping
INSERT INTO routes (id, short_name, long_name, type, fare, forward_direction)
SELECT 
    route_id,
    NULLIF(route_short_name, ''),
    COALESCE(NULLIF(route_long_name, ''), NULLIF(route_desc, ''), 'Unknown Route'),
    CASE 
        WHEN route_type IN (0,1,2) THEN 'train'
        ELSE 'bus'
    END,
    7000,  -- Default fare (VND)
    (route_id LIKE '%_1' OR route_id LIKE '%_A')  -- Forward direction
FROM temp_routes
WHERE route_id IS NOT NULL;

DROP TABLE temp_routes;

-- Kiểm tra kết quả
SELECT COUNT(*) as routes_count FROM routes;
SELECT * FROM routes LIMIT 5;

-- ========================================
-- BƯỚC 3: Import TRIPS
-- ========================================

-- Tạo temp table cho trips
CREATE TEMP TABLE temp_trips (
    route_id VARCHAR(50),
    service_id TEXT,
    trip_id VARCHAR(50),
    trip_headsign TEXT,
    direction_id INT,
    block_id TEXT,
    shape_id TEXT
);

-- Import vào temp table
\\COPY temp_trips FROM '${tripsPath}' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Insert vào bảng chính (chỉ trips có route_id tồn tại)
INSERT INTO trips (trip_id, route_id)
SELECT DISTINCT trip_id, route_id
FROM temp_trips
WHERE trip_id IS NOT NULL
  AND route_id IS NOT NULL
  AND route_id IN (SELECT id FROM routes);

DROP TABLE temp_trips;

-- Kiểm tra kết quả
SELECT COUNT(*) as trips_count FROM trips;
SELECT * FROM trips LIMIT 5;

-- ========================================
-- BƯỚC 4: Import STOP_TIMES
-- ========================================

-- Tạo temp table cho stop_times
CREATE TEMP TABLE temp_stop_times (
    trip_id VARCHAR(50),
    arrival_time TEXT,
    departure_time TEXT,
    stop_id VARCHAR(50),
    stop_sequence INT,
    stop_headsign TEXT,
    pickup_type INT,
    drop_off_type INT,
    shape_dist_traveled DOUBLE PRECISION
);

-- Import vào temp table
\\COPY temp_stop_times FROM '${stopTimesPath}' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Insert vào bảng chính với xử lý time > 24:00:00
INSERT INTO stop_times (trip_id, stop_id, arrival_time, departure_time, stop_sequence)
SELECT 
    trip_id,
    stop_id,
    CASE 
        WHEN arrival_time ~ '^([2-9][0-9]|1[0-9]):' THEN
            -- Convert time > 24:00:00 to valid TIME format
            (SUBSTRING(arrival_time FROM '^([0-9]+):')::INT % 24 || ':' || 
             SUBSTRING(arrival_time FROM '^[0-9]+:(.+)$'))::TIME
        ELSE arrival_time::TIME
    END as arrival_time,
    CASE 
        WHEN departure_time ~ '^([2-9][0-9]|1[0-9]):' THEN
            (SUBSTRING(departure_time FROM '^([0-9]+):')::INT % 24 || ':' || 
             SUBSTRING(departure_time FROM '^[0-9]+:(.+)$'))::TIME
        ELSE departure_time::TIME
    END as departure_time,
    stop_sequence
FROM temp_stop_times
WHERE trip_id IS NOT NULL
  AND stop_id IS NOT NULL
  AND stop_sequence IS NOT NULL
  AND trip_id IN (SELECT trip_id FROM trips)
  AND stop_id IN (SELECT id FROM stops)
  AND arrival_time IS NOT NULL
  AND departure_time IS NOT NULL;

DROP TABLE temp_stop_times;

-- Kiểm tra kết quả
SELECT COUNT(*) as stop_times_count FROM stop_times;
SELECT * FROM stop_times LIMIT 5;

-- ========================================
-- TỔNG KẾT
-- ========================================

SELECT 
    (SELECT COUNT(*) FROM stops) as stops_count,
    (SELECT COUNT(*) FROM routes) as routes_count,
    (SELECT COUNT(*) FROM trips) as trips_count,
    (SELECT COUNT(*) FROM stop_times) as stop_times_count;
`;

  return sql;
}

// Main
try {
  // Kiểm tra file GTFS có tồn tại không
  const requiredFiles = [
    "stops.txt",
    "routes.txt",
    "trips.txt",
    "stop_times.txt",
  ];
  const missingFiles = requiredFiles.filter((file) => {
    const filePath = path.join(GTFS_DIR, file);
    return !fs.existsSync(filePath);
  });

  if (missingFiles.length > 0) {
    console.error("❌ Missing GTFS files:");
    missingFiles.forEach((file) => console.error(`   - ${file}`));
    console.error(`\nPlease ensure all GTFS files are in: ${GTFS_DIR}`);
    process.exit(1);
  }

  // Generate SQL
  const sql = generateCopySQL();

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, sql, "utf8");

  console.log("\n✅ Đã tạo file SQL cho pgAdmin!");
  console.log(`📄 File: ${OUTPUT_FILE}`);
  console.log("\n📋 Hướng dẫn sử dụng:");
  console.log("1. Mở pgAdmin");
  console.log("2. Kết nối vào PostgreSQL server local");
  console.log('3. Chọn database "transitdb"');
  console.log("4. Mở Query Tool (Right-click database → Query Tool)");
  console.log("5. Mở file SQL vừa tạo và copy vào Query Tool");
  console.log("6. Chạy từng phần theo thứ tự (hoặc chạy tất cả)");
  console.log("\n⚠️  Lưu ý: Kiểm tra lại đường dẫn file trong SQL nếu cần!");
  console.log("");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
