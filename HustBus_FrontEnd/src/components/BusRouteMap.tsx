import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BusRadio from './BusRadio';
import StopPreviewCard from './StopPreviewCard';


// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BusRouteMapProps {
  stops: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

// Helper to calculate bearing between two points
const getBearing = (startLat: number, startLng: number, destLat: number, destLng: number) => {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

// Helper to calculate distance between two points (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function BusRouteMap({ stops }: BusRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    markers: L.Layer[];
    route: L.Layer | null;
  }>({ markers: [], route: null });
  const animationRef = useRef<number | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);


  const [hoveredStop, setHoveredStop] = useState<{ id: string; name: string; x: number; y: number } | null>(null);

  // Tile Layer Effect
  // Tile Layer Effect


  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map (default view, will fit bounds later)
    const map = L.map(mapRef.current).setView([10.7769, 106.7009], 13);
    mapInstanceRef.current = map;

    // Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Clear hover on interaction
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.on('click', () => setHoveredStop(null));
    map.on('dragstart', () => setHoveredStop(null));
    map.on('zoomstart', () => setHoveredStop(null));

    return () => {
      map.off('click');
      map.off('dragstart');
      map.off('zoomstart');
    }
  }, [mapInstanceRef.current]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous layers
    layersRef.current.markers.forEach(layer => layer.remove());
    if (layersRef.current.route) layersRef.current.route.remove();
    layersRef.current = { markers: [], route: null };

    // Stop previous animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (busMarkerRef.current) {
      busMarkerRef.current.remove();
      busMarkerRef.current = null;
    }
    if (trailRef.current) {
      trailRef.current.remove();
      trailRef.current = null;
    }

    if (stops.length === 0) return;

    const bounds = L.latLngBounds([]);
    const routeCoords: [number, number][] = [];

    stops.forEach((stop, index) => {
      // Create custom icon for stop
      const isFirst = index === 0;
      const isLast = index === stops.length - 1;

      let bgColor = '#3b82f6'; // blue default
      if (isFirst) bgColor = '#22c55e'; // green start
      if (isLast) bgColor = '#ef4444'; // red end

      const stopIcon = L.divIcon({
        html: `
            <div style="
                width: 20px;
                height: 20px;
                background: ${bgColor};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: white;
            ">
                ${index + 1}
            </div>
            `,
        className: 'bus-stop-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Add stop marker
      const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .addTo(map);

      // Interaction Events
      stopMarker.on('mouseover', () => {
        // Calculate pixel position for tooltip
        const point = map.latLngToContainerPoint([stop.lat, stop.lng]);
        setHoveredStop({
          id: stop.id,
          name: stop.name,
          x: point.x,
          y: point.y
        });
      });

      // We don't hide immediately on mouseout to allow moving to the popup? 
      // Actually standard tooltip behavior is hide on mouseout.
      // Let's hide on specific conditions or use a small delay?
      // For now, strict hover.
      stopMarker.on('click', () => {
        // Maybe zoom in?
        map.setView([stop.lat, stop.lng], 16, { animate: true });
      });

      layersRef.current.markers.push(stopMarker);
      bounds.extend([stop.lat, stop.lng]);
      routeCoords.push([stop.lat, stop.lng]);
    });

    // Draw polyline connecting stops
    if (routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10' // Dashed to indicate it's straight line connection, not exact path
      }).addTo(map);
      layersRef.current.route = polyline;

      // START 3D BUS ANIMATION
      // Create Bus Marker
      const busIcon = L.divIcon({
        className: 'bus-3d-marker',
        html: `
              <div class="bus-3d-container">
                  <div class="bus-body">
                      <div class="bus-roof"></div>
                      <div class="bus-side"></div>
                      <div class="bus-front"></div>
                      <div class="bus-light-glow"></div>
                  </div>
              </div>
          `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      busMarkerRef.current = L.marker(routeCoords[0], {
        icon: busIcon,
        zIndexOffset: 1000
      }).addTo(map);

      // Create Trail Polyline
      trailRef.current = L.polyline([], {
        color: '#f97316', // Orange trail
        weight: 6,
        opacity: 0.6,
        lineCap: 'round',
        className: 'bus-light-trail'
      }).addTo(map);

      // Animation Loop State
      let startTimestamp: number | null = null;
      let segmentStartTime: number | null = null;
      let currentSegmentIndex = 0;
      let isPaused = false;

      const SPEED = 150; // Average speed
      const PAUSE_DURATION = 1000; // 1 second stop at each station

      const animate = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;

        // Initialize segment start time if needed
        if (!segmentStartTime) segmentStartTime = timestamp;

        if (currentSegmentIndex >= routeCoords.length - 1) {
          // Reset loop
          currentSegmentIndex = 0;
          segmentStartTime = timestamp;
          isPaused = false;
          // Loop immediately
        }

        const p1 = routeCoords[currentSegmentIndex];
        const p2 = routeCoords[currentSegmentIndex + 1];
        const dist = getDistance(p1[0], p1[1], p2[0], p2[1]);
        const duration = (dist / SPEED) * 1000;

        // Calculate time elapsed in this segment (excluding pause time if we logic it that way, but here we separate states)
        let timeElapsed = timestamp - segmentStartTime;

        if (isPaused) {
          if (timeElapsed > PAUSE_DURATION) {
            // Resume movement
            isPaused = false;
            segmentStartTime = timestamp;
            timeElapsed = 0;
          } else {
            // Still paused
            // Update marker to stay at p1 (or p2 if we paused at end? Let's pause at p2, i.e. arrival)
            // Actually strategy: Move -> Arrive P2 -> Pause -> Next Segment
            // To make it smooth:
            // 1. Depart P1 (Accelerate)
            // 2. Move
            // 3. Arrive P2 (Decelerate)
            // 4. Pause at P2
          }
        }

        if (!isPaused) {
          // MOVING PHASE
          if (timeElapsed >= duration) {
            // Reached destination P2
            isPaused = true;
            segmentStartTime = timestamp; // Reset timer for pause

            // Snap to P2
            const newPos = new L.LatLng(p2[0], p2[1]);
            busMarkerRef.current?.setLatLng(newPos);

            // Prepare for next segment logic
            currentSegmentIndex++;
          } else {
            // Interpolate
            // Ease-in-out function
            const t = timeElapsed / duration;
            const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Quad ease-in-out

            const lat = p1[0] + (p2[0] - p1[0]) * ease;
            const lng = p1[1] + (p2[1] - p1[1]) * ease;
            const newPos = new L.LatLng(lat, lng);

            busMarkerRef.current?.setLatLng(newPos);

            // Update Bearing
            const bearing = getBearing(p1[0], p1[1], p2[0], p2[1]);
            const markerElement = busMarkerRef.current?.getElement();
            if (markerElement) {
              const container = markerElement.querySelector('.bus-3d-container') as HTMLElement;
              if (container) {
                container.style.transform = `rotate(${bearing}deg)`;
              }
            }
          }
        } else {
          // PAUSING PHASE
          if (timeElapsed >= PAUSE_DURATION) {
            isPaused = false;
            segmentStartTime = timestamp;
          }
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    // Fit map to show all markers
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

  }, [stops]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200" style={{ minHeight: '100%' }}>

      <div
        ref={mapRef}
        className="w-full h-full bg-gray-100"
        style={{ minHeight: '100%' }}
      />

      {/* Overlays */}

      <BusRadio />

      {/* Map Hover Card */}
      {hoveredStop && (
        <StopPreviewCard
          stopName={hoveredStop.name}
          onClose={() => setHoveredStop(null)}
          style={{
            top: hoveredStop.y - 280, // Position above the marker
            left: hoveredStop.x - 128, // Center horizontally (width 256/2)
            zIndex: 2000, // Higher than map controls
          }}
        />
      )}

    </div>
  );
}
