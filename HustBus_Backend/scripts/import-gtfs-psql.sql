-- ========================================
-- SCRIPT IMPORT GTFS VÀO POSTGRESQL BẰNG PSQL
-- ========================================
-- 
-- Usage:
--   psql -U postgres -d transitdb -f scripts/import-gtfs-psql.sql
-- 
-- Hoặc copy toàn bộ script này vào psql và chạy
--
-- ⚠️ LƯU Ý: Sửa đường dẫn file cho đúng với máy của bạn!
-- ========================================

-- ========================================
-- BƯỚC 0: XÓA DỮ LIỆU CŨ (Nếu cần)
-- ========================================

TRUNCATE stop_times CASCADE;
TRUNCATE trips CASCADE;
TRUNCATE stops CASCADE;
TRUNCATE routes CASCADE;

-- ========================================
-- BƯỚC 1: IMPORT ROUTES
-- ========================================

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

-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
\COPY temp_routes FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\routes.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

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
SELECT 'Routes imported: ' || COUNT(*)::TEXT as result FROM routes;

-- ========================================
-- BƯỚC 2: IMPORT STOPS
-- ========================================

CREATE TEMP TABLE temp_stops (
    stop_id VARCHAR(50),
    stop_name TEXT,
    stop_desc TEXT,
    stop_lat DOUBLE PRECISION,
    stop_lon DOUBLE PRECISION,
    zone_id TEXT,
    stop_url TEXT
);

-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
\COPY temp_stops FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stops.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

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

DROP TABLE temp_stops;

-- Kiểm tra kết quả
SELECT 'Stops imported: ' || COUNT(*)::TEXT as result FROM stops;

-- ========================================
-- BƯỚC 3: IMPORT TRIPS
-- ========================================

CREATE TEMP TABLE temp_trips (
    route_id VARCHAR(50),
    service_id TEXT,
    trip_id VARCHAR(50),
    trip_headsign TEXT,
    direction_id INT,
    block_id TEXT,
    shape_id TEXT
);

-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
-- Thêm NULL '' để xử lý giá trị rỗng và QUOTE để xử lý quotes đúng cách
-- Lưu ý: Nếu vẫn gặp lỗi "missing data", có thể có dòng trống trong file - sẽ được xử lý ở bước DELETE phía dưới
\COPY temp_trips FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\trips.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', QUOTE '"');

-- Xóa các dòng trống hoặc không hợp lệ trước khi insert
DELETE FROM temp_trips 
WHERE route_id IS NULL OR route_id = '' 
   OR trip_id IS NULL OR trip_id = '';

-- Insert vào bảng chính
INSERT INTO trips (trip_id, route_id)
SELECT DISTINCT trip_id, route_id
FROM temp_trips
WHERE route_id IN (SELECT id FROM routes);

DROP TABLE temp_trips;

-- Kiểm tra kết quả
SELECT 'Trips imported: ' || COUNT(*)::TEXT as result FROM trips;

-- ========================================
-- BƯỚC 4: IMPORT STOP_TIMES
-- ========================================

CREATE TEMP TABLE temp_stop_times (
    trip_id VARCHAR(50),
    arrival_time TEXT,  -- Dùng TEXT để xử lý format linh hoạt
    departure_time TEXT,
    stop_id VARCHAR(50),
    stop_sequence INT,
    stop_headsign TEXT,
    pickup_type INT,
    drop_off_type INT,
    shape_dist_traveled DOUBLE PRECISION
);

-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
-- Thêm NULL '' để xử lý giá trị rỗng và QUOTE để xử lý quotes đúng cách
\COPY temp_stop_times FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stop_times.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', QUOTE '"');

-- Xóa các dòng trống hoặc không hợp lệ trước khi insert
DELETE FROM temp_stop_times 
WHERE trip_id IS NULL OR trip_id = '' 
   OR stop_id IS NULL OR stop_id = ''
   OR stop_sequence IS NULL;

-- Insert vào bảng chính (chỉ stop_times có trip_id và stop_id tồn tại)
-- Xử lý chuỗi rỗng và convert sang TIME một cách an toàn
-- Ép kiểu rõ ràng về TEXT để tránh lỗi type inference
INSERT INTO stop_times (trip_id, stop_id, arrival_time, departure_time, stop_sequence)
SELECT 
    trip_id,
    stop_id,
    CASE 
        -- Ép kiểu về TEXT rõ ràng, sau đó kiểm tra và convert sang TIME
        WHEN arrival_time::TEXT IS NOT NULL 
         AND TRIM(arrival_time::TEXT) != '' 
         AND TRIM(arrival_time::TEXT) ~ '^\d{2}:\d{2}:\d{2}$' 
        THEN TRIM(arrival_time::TEXT)::TIME
        ELSE NULL
    END,
    CASE 
        -- Ép kiểu về TEXT rõ ràng, sau đó kiểm tra và convert sang TIME
        WHEN departure_time::TEXT IS NOT NULL 
         AND TRIM(departure_time::TEXT) != '' 
         AND TRIM(departure_time::TEXT) ~ '^\d{2}:\d{2}:\d{2}$' 
        THEN TRIM(departure_time::TEXT)::TIME
        ELSE NULL
    END,
    stop_sequence
FROM temp_stop_times
WHERE trip_id IN (SELECT trip_id FROM trips)
  AND stop_id IN (SELECT id FROM stops);

DROP TABLE temp_stop_times;

-- Kiểm tra kết quả
SELECT 'Stop Times imported: ' || COUNT(*)::TEXT as result FROM stop_times;

-- ========================================
-- TỔNG KẾT
-- ========================================

SELECT 
    '=== IMPORT HOÀN TẤT ===' as status,
    (SELECT COUNT(*) FROM routes) as routes_count,
    (SELECT COUNT(*) FROM stops) as stops_count,
    (SELECT COUNT(*) FROM trips) as trips_count,
    (SELECT COUNT(*) FROM stop_times) as stop_times_count;

