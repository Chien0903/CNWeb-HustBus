from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
import ferrobus
import datetime
from zoneinfo import ZoneInfo
import math
import json
from pathlib import Path

app = FastAPI()

# --- Lấy đường dẫn tuyệt đối của thư mục chứa file main.py ---
APP_DIR = Path(__file__).parent
GTFS_DIR = APP_DIR / "gtfs_hanoi"
OSM_FILE = GTFS_DIR / "hanoi_extended_v2.osm.pbf"

print(f"✓ APP_DIR: {APP_DIR}")
print(f"✓ GTFS_DIR: {GTFS_DIR}")
print(f"✓ OSM_FILE: {OSM_FILE}")
print(f"✓ OSM file exists: {OSM_FILE.exists()}")

# --- Khởi tạo transit model (chỉ làm 1 lần khi app chạy) ---
# IMPORTANT:
# We must choose the "service date" that matches the GTFS calendar.
# On servers running in UTC (common on EC2/Docker), using datetime.date.today()
# can lead to mismatches vs Vietnam local date/time and result in 0 transit results.
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")
SERVICE_DATE = datetime.datetime.now(VN_TZ).date()
try:
    model = ferrobus.create_transit_model(
        osm_path=str(OSM_FILE),           # Dùng absolute path
        gtfs_dirs=[str(GTFS_DIR)],        # Dùng absolute path
        date=SERVICE_DATE
    )
    print("✓ Transit model created successfully")
except Exception as e:
    print(f"✗ Error creating transit model: {e}")
    raise

# --- Helper: chuyển hh:mm:ss -> giây ---
def time_to_seconds(time_str: str):
    try:
        h, m, s = map(int, time_str.split(":"))
        return h * 3600 + m * 60 + s
    except:
        raise HTTPException(status_code=400, detail="Time phải ở định dạng hh:mm:ss")

# --- Helper: chuyển giây -> hh:mm:ss ---
def seconds_to_time(seconds: int):
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"

def parse_journey_segments(journey_geojson, departure_time_seconds):
    """
    Parse journey GeoJSON và trích xuất segments (chỉ các leg_type = 'transit')
    """
    segments = []
    
    if isinstance(journey_geojson, str):
        journey_data = json.loads(journey_geojson)
    else:
        journey_data = journey_geojson
    
    features = journey_data.get("features", [])
    
    for feature in features:
        props = feature.get("properties", {})
        leg_type = props.get("leg_type")
        
        # Chỉ lấy các chuyến transit (xe buýt)
        if leg_type == "transit":
            route_id = props.get("route_id", "")
            # Tách route_id để lấy số tuyến (ví dụ "34_1" -> "34")
            line_name = route_id.split("_")[0] if route_id else ""
            
            segment = {
                "lineId": route_id,
                "lineName": line_name,
                "mode": "bus",
                "duration_sec": props.get("duration", 0),
                "duration_min": props.get("duration", 0) // 60,
                "from_stop": props.get("from_name", ""),
                "to_stop": props.get("to_name", ""),
                "departure_time": seconds_to_time(props.get("departure_time", 0)),
                "arrival_time": seconds_to_time(props.get("arrival_time", 0)),
                "trip_id": props.get("trip_id", "")
            }
            segments.append(segment)
    
    return segments

@app.get("/find_routes")
def find_routes(
    lat_from: float = Query(..., description="Latitude xuất phát"),
    lon_from: float = Query(..., description="Longitude xuất phát"),
    lat_to: float = Query(..., description="Latitude điểm đến"),
    lon_to: float = Query(..., description="Longitude điểm đến"),
    time: str = Query(..., description="Thời gian khởi hành hh:mm:ss"),
    max_transfers: int = Query(3, description="Số lần chuyển tuyến tối đa")
):
    """
    Tìm nhiều hành trình bằng cách gọi find_route với các max_transfers khác nhau (0, 1, 2, ..., max_transfers)
    """
    # --- Tạo điểm start / end ---
    origin = ferrobus.create_transit_point(lat_from, lon_from, model)
    destination = ferrobus.create_transit_point(lat_to, lon_to, model)

    departure_time = time_to_seconds(time)

    # --- Tìm nhiều tuyến xe với các max_transfers khác nhau ---
    all_routes = []
    errors = []

    # Gọi find_route với max_transfers từ 0 đến max_transfers
    try:
        route_result = ferrobus.find_route(
            transit_model=model,
            start_point=origin,
            end_point=destination,
            departure_time=departure_time,
            max_transfers=max_transfers
        )
        
        journey = ferrobus.detailed_journey(
            transit_model=model,
            start_point=origin,
            end_point=destination,
            departure_time=departure_time,
            max_transfers=max_transfers
        )
        
        # Kiểm tra nếu tìm thấy route
        if route_result and route_result.get("used_transit", False):
            # Parse segments từ journey
            segments = parse_journey_segments(journey, departure_time)
            
            # Tính thống kê
            travel_time_seconds = route_result.get("travel_time_seconds", 0)
            walking_time_seconds = route_result.get("walking_time_seconds", 0)
            transit_time_seconds = route_result.get("transit_time_seconds", 0)
            actual_transfers = route_result.get("transfers", 0)
            
            route_obj = {
                "id": f"route_{max_transfers}",
                "actual_transfers": actual_transfers,
                "summary": f"{len(segments)} tuyến, {actual_transfers} lần chuyển, tổng {travel_time_seconds} giay",
                "details": {
                    "departure_time": seconds_to_time(departure_time),
                    "total_time_sec": travel_time_seconds,
                    "walking_time_sec": walking_time_seconds,
                    "transit_time_sec": transit_time_seconds,
                    "transfers_count": actual_transfers
                },
                "from": {"lat": lat_from, "lon": lon_from},
                "to": {"lat": lat_to, "lon": lon_to},
                "segments": segments
            }
            all_routes.append(route_obj)
    
    except Exception as e:
            errors.append(f"{str(e)}")
    
    # --- Kiểm tra nếu không tìm thấy hành trình nào ---
    if not all_routes:
        return {
            "message": "Không tìm thấy lộ trình xe buýt phù hợp.",
            "details": {
                "from": {"lat": lat_from, "lon": lon_from},
                "to": {"lat": lat_to, "lon": lon_to},
                "reason": "Có thể chưa có tuyến xe nào kết nối giữa 2 điểm này",
                "suggestions": [
                    "Thử tìm stops gần điểm xuất phát và đích",
                    "Kiểm tra xem có tuyến xe nào đi qua khu vực gần đó",
                    "Với khoảng cách ngắn này, bạn có thể cân nhắc đi bộ hoặc sử dụng phương tiện khác"
                ],
                "errors": errors if errors else None
            }
        }
    return all_routes
    
@app.get("/find_route")
def find_route(
    lat_from: float = Query(..., description="Latitude xuất phát"),
    lon_from: float = Query(..., description="Longitude xuất phát"),
    lat_to: float = Query(..., description="Latitude điểm đến"),
    lon_to: float = Query(..., description="Longitude điểm đến"),
    time: str = Query(..., description="Thời gian khởi hành hh:mm:ss"),
    max_transfers: int = Query(3, description="Số lần chuyển tuyến tối đa")
):
    """
    Tìm 1 hành trình tốt nhất với max_transfers được chỉ định
    """
    # --- Tạo điểm start / end ---
    origin = ferrobus.create_transit_point(lat_from, lon_from, model)
    destination = ferrobus.create_transit_point(lat_to, lon_to, model)

    departure_time = time_to_seconds(time)


    # --- Tìm tuyến xe ---
    try:
        route_result = ferrobus.find_route(
            transit_model=model,
            start_point=origin,
            end_point=destination,
            departure_time=departure_time,
            max_transfers=max_transfers
        )
        journey = ferrobus.detailed_journey(
            transit_model=model,
            start_point=origin,
            end_point=destination,
            departure_time=departure_time,
            max_transfers=max_transfers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tìm kiếm tuyến: {str(e)}")

    # --- Check nếu không tìm thấy tuyến ---
    if not route_result:
        return {
            "message": "Không tìm thấy lộ trình xe buýt phù hợp.",
            "details": {
                "from": {"lat": lat_from, "lon": lon_from},
                "to": {"lat": lat_to, "lon": lon_to},
                "reason": "Có thể chưa có tuyến xe nào kết nối giữa 2 điểm này"
            }
        }

    # --- Parse segments từ journey GeoJSON ---
    segments = parse_journey_segments(journey, departure_time)

    # --- Tính tổng thời gian ---
    travel_time_seconds = route_result.get("travel_time_seconds", 0)
    walking_time_seconds = route_result.get("walking_time_seconds", 0)
    transit_time_seconds = route_result.get("transit_time_seconds", 0)
    transfers = route_result.get("transfers", 0)

    routes = [{
        "summary": f"{len(segments)} tuyến, tổng {travel_time_seconds}s",
        "details": {
            "total_time_sec": travel_time_seconds,
            "walking_time_sec": walking_time_seconds,
            "transit_time_sec": transit_time_seconds,
            "transfers_count": transfers
        }
    }]

    return {
        "from": {"lat": lat_from, "lon": lon_from},
        "to": {"lat": lat_to, "lon": lon_to},
        "routes": routes,
        "segments": segments
    }
