# 📘 HƯỚNG DẪN SỬ DỤNG PSQL ĐỂ IMPORT DỮ LIỆU GTFS

## 🎯 Mục Đích

Hướng dẫn chi tiết cách sử dụng công cụ `psql` (PostgreSQL command-line tool) để import dữ liệu GTFS từ thư mục `data/gtfs/` vào database PostgreSQL.

---

## 📋 Yêu Cầu

- ✅ PostgreSQL đã được cài đặt
- ✅ Database `transitdb` đã được tạo
- ✅ Schema đã được tạo (chạy `npx prisma migrate deploy` hoặc `npx prisma db push`)
- ✅ Các file GTFS trong thư mục `data/gtfs/`:
  - `routes.txt`
  - `stops.txt`
  - `trips.txt`
  - `stop_times.txt`

---

## 🔌 Cách Kết Nối psql

### Cách 1: Kết nối trực tiếp

```bash
psql -U postgres -d transitdb
```

### Cách 2: Kết nối với password prompt

```bash
psql -U postgres -d transitdb -W
```

### Cách 3: Kết nối với connection string

```bash
psql "postgresql://postgres:your_password@localhost:5432/transitdb"
```

**Lưu ý:** Thay `your_password` bằng mật khẩu PostgreSQL của bạn.

---

## 📁 Đường Dẫn File GTFS

**Đường dẫn đầy đủ trên Windows:**

```
C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\
```

**Trong psql, bạn có thể dùng đường dẫn tương đối hoặc tuyệt đối.**

---

## ⚠️ THỨ TỰ IMPORT (QUAN TRỌNG!)

Bạn **PHẢI** import theo thứ tự sau vì có **foreign key constraints**:

```
1️⃣ routes.txt     → Bảng routes    (Không phụ thuộc)
2️⃣ stops.txt      → Bảng stops     (Không phụ thuộc)
3️⃣ trips.txt      → Bảng trips     (Phụ thuộc routes)
4️⃣ stop_times.txt → Bảng stop_times (Phụ thuộc trips và stops)
```

---

## 🚀 CÁC CÁCH IMPORT

### Cách 1: Dùng COPY với Temp Table (Khuyến nghị)

Cách này cho phép bạn map các cột từ GTFS sang schema database một cách linh hoạt.

#### Bước 1: Xóa dữ liệu cũ (nếu cần)

```sql
TRUNCATE stop_times CASCADE;
TRUNCATE trips CASCADE;
TRUNCATE stops CASCADE;
TRUNCATE routes CASCADE;
```

#### Bước 2: Import Routes

```sql
-- Tạo temp table
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
-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
\COPY temp_routes FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\routes.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

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

-- Xóa temp table
DROP TABLE temp_routes;

-- Kiểm tra kết quả
SELECT COUNT(*) as routes_count FROM routes;
```

#### Bước 3: Import Stops

```sql
-- Tạo temp table
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
-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
\COPY temp_stops FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stops.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Insert vào bảng chính
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
```

#### Bước 4: Import Trips

```sql
-- Tạo temp table
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
-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
-- Thêm NULL '' để xử lý giá trị rỗng
\COPY temp_trips FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\trips.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', QUOTE '"');

-- Xóa các dòng trống hoặc không hợp lệ trước khi insert
DELETE FROM temp_trips
WHERE route_id IS NULL OR route_id = ''
   OR trip_id IS NULL OR trip_id = '';

-- Insert vào bảng chính (chỉ trips có route_id tồn tại)
INSERT INTO trips (trip_id, route_id)
SELECT DISTINCT trip_id, route_id
FROM temp_trips
WHERE route_id IN (SELECT id FROM routes);

-- Xóa temp table
DROP TABLE temp_trips;

-- Kiểm tra kết quả
SELECT COUNT(*) as trips_count FROM trips;
```

#### Bước 5: Import Stop Times

```sql
-- Tạo temp table
-- ⚠️ LƯU Ý: arrival_time và departure_time phải là TEXT để xử lý chuỗi rỗng
CREATE TEMP TABLE temp_stop_times (
    trip_id VARCHAR(50),
    arrival_time TEXT,  -- Dùng TEXT để xử lý format linh hoạt và chuỗi rỗng
    departure_time TEXT,
    stop_id VARCHAR(50),
    stop_sequence INT,
    stop_headsign TEXT,
    pickup_type INT,
    drop_off_type INT,
    shape_dist_traveled DOUBLE PRECISION
);

-- Import vào temp table
-- ⚠️ SỬA ĐƯỜNG DẪN FILE CHO ĐÚNG!
-- Thêm NULL '' để xử lý giá trị rỗng
\COPY temp_stop_times FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stop_times.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', QUOTE '"');

-- Xóa các dòng trống hoặc không hợp lệ trước khi insert
DELETE FROM temp_stop_times
WHERE trip_id IS NULL OR trip_id = ''
   OR stop_id IS NULL OR stop_id = ''
   OR stop_sequence IS NULL;

-- Insert vào bảng chính (chỉ stop_times có trip_id và stop_id tồn tại)
-- Xử lý chuỗi rỗng và convert sang TIME một cách an toàn
-- Ép kiểu rõ ràng về TEXT để tránh lỗi type inference của PostgreSQL
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

-- Xóa temp table
DROP TABLE temp_stop_times;

-- Kiểm tra kết quả
SELECT COUNT(*) as stop_times_count FROM stop_times;
```

---

### Cách 2: Dùng COPY Trực Tiếp (Nhanh nhưng cần đúng cột)

**⚠️ Lưu ý:** Cách này chỉ hoạt động nếu file GTFS có đúng số cột và thứ tự cột với schema database.

```sql
-- Bước 1: Routes
\COPY routes(id, short_name, long_name, type, fare, forward_direction) FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\routes.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Bước 2: Stops
\COPY stops(id, name, lat, lng, type) FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stops.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Bước 3: Trips
\COPY trips(trip_id, route_id) FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\trips.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Bước 4: Stop Times
\COPY stop_times(trip_id, stop_id, arrival_time, departure_time, stop_sequence) FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stop_times.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');
```

**⚠️ Cảnh báo:** Cách này có thể không hoạt động vì:

- File GTFS có nhiều cột hơn schema database
- Thứ tự cột không khớp
- Cần transform dữ liệu (ví dụ: route_type → type)

**Khuyến nghị:** Dùng **Cách 1** với temp table để đảm bảo import đúng.

---

## 📝 Script Hoàn Chỉnh (Copy & Paste)

Tạo file `import-gtfs-psql.sql` và chạy:

```bash
psql -U postgres -d transitdb -f import-gtfs-psql.sql
```

Hoặc copy toàn bộ script dưới đây vào psql:

```sql
-- ========================================
-- SCRIPT IMPORT GTFS VÀO POSTGRESQL
-- ========================================

-- Xóa dữ liệu cũ
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
    7000,
    (route_id LIKE '%_1' OR route_id LIKE '%_A')
FROM temp_routes
WHERE route_id IS NOT NULL;

DROP TABLE temp_routes;
SELECT COUNT(*) as routes_count FROM routes;

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

\COPY temp_stops FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stops.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

INSERT INTO stops (id, name, lat, lng, type)
SELECT
    stop_id,
    COALESCE(NULLIF(stop_name, ''), NULLIF(stop_desc, ''), 'Unknown Stop'),
    stop_lat,
    stop_lon,
    'bus'
FROM temp_stops
WHERE stop_lat IS NOT NULL
  AND stop_lon IS NOT NULL
  AND stop_lat != 0
  AND stop_lon != 0
  AND stop_id IS NOT NULL;

DROP TABLE temp_stops;
SELECT COUNT(*) as stops_count FROM stops;

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

\COPY temp_trips FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\trips.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',');

INSERT INTO trips (trip_id, route_id)
SELECT DISTINCT trip_id, route_id
FROM temp_trips
WHERE trip_id IS NOT NULL
  AND route_id IS NOT NULL
  AND route_id IN (SELECT id FROM routes);

DROP TABLE temp_trips;
SELECT COUNT(*) as trips_count FROM trips;

-- ========================================
-- BƯỚC 4: IMPORT STOP_TIMES
-- ========================================
CREATE TEMP TABLE temp_stop_times (
    trip_id VARCHAR(50),
    arrival_time TEXT,  -- Dùng TEXT để xử lý format linh hoạt và chuỗi rỗng
    departure_time TEXT,
    stop_id VARCHAR(50),
    stop_sequence INT,
    stop_headsign TEXT,
    pickup_type INT,
    drop_off_type INT,
    shape_dist_traveled DOUBLE PRECISION
);

\COPY temp_stop_times FROM 'C:\Users\ACER\OneDrive - Hanoi University of Science and Technology\Desktop\Source Code\HustBus\HustBus_Backend\data\gtfs\stop_times.txt' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', QUOTE '"');

-- Xóa các dòng trống hoặc không hợp lệ trước khi insert
DELETE FROM temp_stop_times
WHERE trip_id IS NULL OR trip_id = ''
   OR stop_id IS NULL OR stop_id = ''
   OR stop_sequence IS NULL;

INSERT INTO stop_times (trip_id, stop_id, arrival_time, departure_time, stop_sequence)
SELECT
    trip_id,
    stop_id,
    CASE
        -- Dùng NULLIF để chuyển chuỗi rỗng thành NULL, TRIM để loại bỏ khoảng trắng
        -- Chỉ convert khi giá trị không NULL và đúng format HH:MM:SS
        WHEN NULLIF(TRIM(arrival_time), '') IS NOT NULL
         AND NULLIF(TRIM(arrival_time), '') ~ '^\d{2}:\d{2}:\d{2}$'
        THEN NULLIF(TRIM(arrival_time), '')::TIME
        ELSE NULL
    END,
    CASE
        -- Dùng NULLIF để chuyển chuỗi rỗng thành NULL, TRIM để loại bỏ khoảng trắng
        -- Chỉ convert khi giá trị không NULL và đúng format HH:MM:SS
        WHEN NULLIF(TRIM(departure_time), '') IS NOT NULL
         AND NULLIF(TRIM(departure_time), '') ~ '^\d{2}:\d{2}:\d{2}$'
        THEN NULLIF(TRIM(departure_time), '')::TIME
        ELSE NULL
    END,
    stop_sequence
FROM temp_stop_times
WHERE trip_id IN (SELECT trip_id FROM trips)
  AND stop_id IN (SELECT id FROM stops);

DROP TABLE temp_stop_times;
SELECT COUNT(*) as stop_times_count FROM stop_times;

-- ========================================
-- KIỂM TRA KẾT QUẢ
-- ========================================
SELECT
    (SELECT COUNT(*) FROM routes) as routes_count,
    (SELECT COUNT(*) FROM stops) as stops_count,
    (SELECT COUNT(*) FROM trips) as trips_count,
    (SELECT COUNT(*) FROM stop_times) as stop_times_count;
```

---

## 🔍 Kiểm Tra Sau Khi Import

```sql
-- Kiểm tra số lượng records
SELECT COUNT(*) FROM routes;      -- ~224 routes
SELECT COUNT(*) FROM stops;        -- ~6,495 stops
SELECT COUNT(*) FROM trips;        -- ~9,737 trips
SELECT COUNT(*) FROM stop_times;   -- ~324,287 stop_times

-- Kiểm tra sample data
SELECT * FROM routes LIMIT 5;
SELECT * FROM stops LIMIT 5;
SELECT * FROM trips LIMIT 5;
SELECT * FROM stop_times LIMIT 5;

-- Kiểm tra foreign key relationships
SELECT COUNT(*)
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
WHERE r.id IS NULL;  -- Phải = 0

SELECT COUNT(*)
FROM stop_times st
LEFT JOIN trips t ON st.trip_id = t.trip_id
LEFT JOIN stops s ON st.stop_id = s.id
WHERE t.trip_id IS NULL OR s.id IS NULL;  -- Phải = 0
```

---

## ⚠️ Xử Lý Lỗi Thường Gặp

### Lỗi 1: `ERROR: could not open file "..." for reading: No such file or directory`

**Nguyên nhân:** Đường dẫn file không đúng.

**Giải pháp:**

- Kiểm tra đường dẫn file có đúng không
- Trên Windows, dùng đường dẫn đầy đủ với backslash `\`
- Hoặc dùng forward slash `/` và escape spaces: `'C:/Users/ACER/OneDrive - Hanoi University of Science and Technology/...'`
- Hoặc dùng đường dẫn tương đối từ thư mục hiện tại của psql

### Lỗi 2: `ERROR: foreign key constraint violation`

**Nguyên nhân:** Import sai thứ tự hoặc thiếu dữ liệu.

**Giải pháp:**

- Đảm bảo import theo đúng thứ tự: routes → stops → trips → stop_times
- Kiểm tra xem các bảng phụ thuộc đã có dữ liệu chưa

### Lỗi 3: `ERROR: missing data for column "service_id"` hoặc `ERROR: missing data for column "..."`

**Nguyên nhân:** File GTFS có dòng trống hoặc dòng thiếu dữ liệu.

**Giải pháp:**

**Cách 1: Dùng script tự động để sửa file (Khuyến nghị)**

```bash
cd HustBus_Backend

# Sửa file trips.txt
node scripts/fix-trips-file.js

# Sửa file stop_times.txt (nếu gặp lỗi tương tự)
node scripts/fix-stop-times-file.js
```

Script này sẽ:

- Backup file gốc
- Xóa các dòng trống hoặc không hợp lệ
- Tạo file mới đã được làm sạch

**Cách 2: Sửa thủ công trong psql**

Script SQL đã được cập nhật để tự động xóa các dòng không hợp lệ sau khi import vào temp table:

```sql
-- Xóa các dòng trống hoặc không hợp lệ trước khi insert
DELETE FROM temp_trips
WHERE route_id IS NULL OR route_id = ''
   OR trip_id IS NULL OR trip_id = '';
```

**Cách 3: Sửa file trực tiếp**

Mở file `trips.txt` và xóa các dòng trống ở cuối file.

### Lỗi 4: `ERROR: invalid input syntax for type time`

**Nguyên nhân:** Format thời gian trong file GTFS không đúng.

**Giải pháp:**

- Kiểm tra format thời gian trong file `stop_times.txt`
- Dùng `CASE` để xử lý các giá trị NULL hoặc format không đúng

### Lỗi 5: `ERROR: duplicate key value violates unique constraint`

**Nguyên nhân:** Đang import dữ liệu trùng lặp.

**Giải pháp:**

- Xóa dữ liệu cũ trước khi import: `TRUNCATE ... CASCADE;`
- Hoặc dùng `INSERT ... ON CONFLICT DO NOTHING;`

---

## 💡 Mẹo Và Best Practices

1. **Luôn backup database trước khi import:**

   ```bash
   pg_dump -U postgres -d transitdb > backup.sql
   ```

2. **Dùng transaction để rollback nếu có lỗi:**

   ```sql
   BEGIN;
   -- Các lệnh import...
   COMMIT;  -- Hoặc ROLLBACK nếu có lỗi
   ```

3. **Kiểm tra từng bước:**

   - Sau mỗi bước import, chạy `SELECT COUNT(*)` để kiểm tra
   - Xem sample data với `SELECT * FROM ... LIMIT 5;`

4. **Dùng đường dẫn tuyệt đối:**

   - Tránh lỗi "file not found"
   - Dễ debug hơn

5. **Xử lý encoding:**
   - Nếu có ký tự đặc biệt, thêm `ENCODING 'UTF8'` vào lệnh COPY

---

## 📚 Tài Liệu Tham Khảo

- [PostgreSQL COPY Documentation](https://www.postgresql.org/docs/current/sql-copy.html)
- [psql Documentation](https://www.postgresql.org/docs/current/app-psql.html)
- File `PGADMIN_COPY_COMMANDS.sql` trong thư mục `HustBus_Backend/`

---

## ✅ Tóm Tắt

| Bước | File GTFS        | Bảng Database | Lệnh                               |
| ---- | ---------------- | ------------- | ---------------------------------- |
| 1️⃣   | `routes.txt`     | `routes`      | `\COPY temp_routes FROM '...'`     |
| 2️⃣   | `stops.txt`      | `stops`       | `\COPY temp_stops FROM '...'`      |
| 3️⃣   | `trips.txt`      | `trips`       | `\COPY temp_trips FROM '...'`      |
| 4️⃣   | `stop_times.txt` | `stop_times`  | `\COPY temp_stop_times FROM '...'` |

**Nhớ:** Luôn import theo thứ tự: **routes → stops → trips → stop_times**!
