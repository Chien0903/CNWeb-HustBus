# 🚀 HƯỚNG DẪN CHẠY FASTAPI

## 🎯 Mục Đích

Hướng dẫn chi tiết cách chạy FastAPI service cho tính năng tìm lộ trình giao thông công cộng.

---

## 📋 Yêu Cầu

- ✅ Python 3.11+ đã được cài đặt
- ✅ Virtual environment đã được tạo và kích hoạt
- ✅ Các dependencies đã được cài đặt (`fastapi`, `uvicorn`, `ferrobus`)
- ✅ File GTFS và OSM đã có trong thư mục `app/gtfs_hanoi/`

---

## 🔌 Cách 1: Chạy Trực Tiếp với Python (Khuyến nghị cho Development)

### Bước 1: Kích hoạt Virtual Environment

**Trên Windows (Git Bash):**

```bash
cd fastapi
source venv/Scripts/activate
```

**Trên Windows (PowerShell):**

```bash
cd fastapi
.\venv\Scripts\Activate.ps1
```

**Trên Windows (CMD):**

```bash
cd fastapi
venv\Scripts\activate.bat
```

### Bước 2: Kiểm tra Dependencies

```bash
pip list
```

Bạn sẽ thấy:

- `fastapi`
- `uvicorn[standard]`
- `ferrobus`

Nếu thiếu, cài đặt lại:

```bash
pip install -r requirements.txt
```

### Bước 3: Chạy FastAPI Server

**Cách 1: Dùng uvicorn trực tiếp (Khuyến nghị)**

```bash
cd fastapi
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Cách 2: Dùng Python module**

```bash
cd fastapi
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Các tham số:**

- `--host 0.0.0.0` - Cho phép truy cập từ mọi địa chỉ IP
- `--port 8000` - Port mặc định
- `--reload` - Tự động reload khi code thay đổi (chỉ dùng cho development)

### Bước 4: Kiểm tra Server

Mở trình duyệt và truy cập:

- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/docs (sẽ tự động load)

---

## 🐳 Cách 2: Chạy với Docker (Khuyến nghị cho Production)

### Bước 1: Build Docker Image

```bash
cd fastapi
docker build -t raptor-api-hanoi:latest .
```

### Bước 2: Chạy Container

```bash
docker run -d \
  --name raptor-api \
  -p 8000:8000 \
  -v "$(pwd)/app:/app/app" \
  --memory="7g" \
  --cpus="2" \
  raptor-api-hanoi:latest
```

Hoặc dùng docker-compose (dễ hơn):

```bash
cd fastapi
docker-compose up -d
```

### Bước 3: Kiểm tra Logs

```bash
docker logs -f raptor-api
```

Hoặc với docker-compose:

```bash
docker-compose logs -f
```

### Bước 4: Dừng Container

```bash
docker stop raptor-api
docker rm raptor-api
```

Hoặc với docker-compose:

```bash
docker-compose down
```

---

## 📡 Các API Endpoints

### 1. Tìm Lộ Trình (`/find_routes`)

**GET** `http://localhost:8000/find_routes`

**Query Parameters:**

- `lat_from` (float, required) - Vĩ độ điểm xuất phát
- `lon_from` (float, required) - Kinh độ điểm xuất phát
- `lat_to` (float, required) - Vĩ độ điểm đến
- `lon_to` (float, required) - Kinh độ điểm đến
- `time` (string, required) - Thời gian khởi hành (format: `hh:mm:ss`)
- `max_transfers` (int, optional, default: 3) - Số lần chuyển tuyến tối đa

**Ví dụ:**

```bash
curl "http://localhost:8000/find_routes?lat_from=21.0285&lon_from=105.8542&lat_to=21.0245&lon_to=105.8412&time=08:00:00&max_transfers=2"
```

### 2. Tìm Một Lộ Trình (`/find_route`)

**GET** `http://localhost:8000/find_route`

**Query Parameters:** (Giống như `/find_routes`)

**Ví dụ:**

```bash
curl "http://localhost:8000/find_route?lat_from=21.0285&lon_from=105.8542&lat_to=21.0245&lon_to=105.8412&time=08:00:00&max_transfers=2"
```

---

## 🔍 Kiểm Tra và Debug

### Kiểm tra Server đang chạy

```bash
# Kiểm tra port 8000
netstat -an | findstr :8000

# Hoặc dùng curl
curl http://localhost:8000/docs
```

### Kiểm tra Logs

**Khi chạy trực tiếp:**

- Logs sẽ hiển thị trực tiếp trong terminal

**Khi chạy với Docker:**

```bash
docker logs raptor-api
docker logs -f raptor-api  # Follow logs
```

### Kiểm tra Dependencies

```bash
python -c "import fastapi; print(fastapi.__version__)"
python -c "import uvicorn; print(uvicorn.__version__)"
python -c "import ferrobus; print(ferrobus.__version__)"
```

### Kiểm tra File GTFS và OSM

```bash
cd fastapi/app/gtfs_hanoi
ls -la

# Kiểm tra các file cần thiết
ls routes.txt stops.txt trips.txt stop_times.txt
ls hanoi_extended_v2.osm.pbf
```

---

## ⚠️ Xử Lý Lỗi Thường Gặp

### Lỗi 1: `ModuleNotFoundError: No module named 'ferrobus'`

**Nguyên nhân:** Package `ferrobus` chưa được cài đặt hoặc virtual environment chưa được kích hoạt.

**Giải pháp:**

```bash
# Kích hoạt virtual environment
source venv/Scripts/activate  # Git Bash
# hoặc
.\venv\Scripts\Activate.ps1   # PowerShell

# Cài đặt lại dependencies
pip install -r requirements.txt
```

### Lỗi 2: `FileNotFoundError: hanoi_extended_v2.osm.pbf`

**Nguyên nhân:** File OSM không tồn tại hoặc đường dẫn sai.

**Giải pháp:**

```bash
# Kiểm tra file có tồn tại không
ls fastapi/app/gtfs_hanoi/hanoi_extended_v2.osm.pbf

# Nếu không có, cần tải file OSM về
```

### Lỗi 3: `Address already in use` hoặc `Port 8000 is already in use`

**Nguyên nhân:** Port 8000 đã được sử dụng bởi process khác.

**Giải pháp:**

**Cách 1: Tìm và kill process đang dùng port 8000**

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Hoặc dùng port khác
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Cách 2: Dùng port khác**

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Lỗi 4: `Error creating transit model`

**Nguyên nhân:** File GTFS hoặc OSM không hợp lệ hoặc thiếu dữ liệu.

**Giải pháp:**

- Kiểm tra các file GTFS có đầy đủ không
- Kiểm tra file OSM có hợp lệ không
- Xem logs để biết chi tiết lỗi

### Lỗi 5: Virtual Environment không hoạt động trên Windows

**Nguyên nhân:** Script activation không chạy được.

**Giải pháp:**

**Git Bash:**

```bash
source venv/Scripts/activate
```

**PowerShell:**

```powershell
# Nếu bị lỗi execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**CMD:**

```cmd
venv\Scripts\activate.bat
```

---

## 🚀 Script Chạy Nhanh

Tạo file `run.bat` (Windows) hoặc `run.sh` (Linux/Mac):

**run.bat (Windows):**

```batch
@echo off
cd /d %~dp0
call venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
```

**run.sh (Linux/Mac):**

```bash
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Sau đó chạy:

```bash
# Windows
run.bat

# Linux/Mac
chmod +x run.sh
./run.sh
```

---

## 📊 Kiểm Tra Performance

### Kiểm tra Memory Usage

```bash
# Windows
tasklist | findstr python

# Linux/Mac
ps aux | grep uvicorn
```

### Kiểm tra Response Time

```bash
# Dùng curl với time
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/find_routes?lat_from=21.0285&lon_from=105.8542&lat_to=21.0245&lon_to=105.8412&time=08:00:00"
```

---

## 🔧 Cấu Hình Nâng Cao

### Chạy với nhiều Workers (Production)

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Lưu ý:** Không dùng `--reload` khi chạy với nhiều workers.

### Chạy với Gunicorn (Production)

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Cấu hình Timeout

```bash
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --timeout-keep-alive 30 \
  --timeout-graceful-shutdown 10
```

---

## 📝 Tóm Tắt

### Chạy Development (Nhanh nhất)

```bash
cd fastapi
source venv/Scripts/activate  # Git Bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Chạy Production với Docker

```bash
cd fastapi
docker-compose up -d
```

### Kiểm tra Server

- **API Docs:** http://localhost:8000/docs
- **Health:** http://localhost:8000/docs (tự động load)

---

## 🔗 Liên Kết Hữu Ích

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Ferrobus Documentation](https://github.com/ferrobus/ferrobus)

---

## ✅ Checklist Trước Khi Chạy

- [ ] Python 3.11+ đã được cài đặt
- [ ] Virtual environment đã được tạo
- [ ] Dependencies đã được cài đặt (`pip install -r requirements.txt`)
- [ ] File GTFS đã có trong `app/gtfs_hanoi/`
- [ ] File OSM đã có trong `app/gtfs_hanoi/`
- [ ] Port 8000 chưa được sử dụng
- [ ] Virtual environment đã được kích hoạt

Sau khi hoàn tất checklist, bạn có thể chạy FastAPI server!
