import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons logic
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [21.028511, 105.804817];

interface SimpleMapViewerProps {
    coordinates?: any[];
    geometries?: any[];
    segments?: any[];
    onMapClick?: (lat: number, lng: number) => void;
    className?: string; // Thêm prop này để nhận class từ cha
}

/**
 * Simple MapViewer using vanilla Leaflet to avoid React-Leaflet re-render issues
 */
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

export default function SimpleMapViewer({
    coordinates = [],
    geometries = [],
    segments = [],
    onMapClick,
    className
}: SimpleMapViewerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);
    const animationRef = useRef<number | null>(null);
    const busMarkerRef = useRef<L.Marker | null>(null);
    const trailRef = useRef<L.Polyline | null>(null);

    useEffect(() => {
        // Only initialize map once
        if (!mapInstanceRef.current && mapRef.current) {

            const positions = coordinates
                .filter(point => point && point.coords)
                .map(point => [point.coords.lat, point.coords.lng] as [number, number]);

            const center = positions[0] || DEFAULT_CENTER;

            // Create map
            const map = L.map(mapRef.current, {
                center: center,
                zoom: 13,
                scrollWheelZoom: true,
            });

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
            }).addTo(map);

            mapInstanceRef.current = map;

            map.on('click', (e) => {
                if (onMapClick) {
                    onMapClick(e.latlng.lat, e.latlng.lng);
                }
            });

            // Fix size after render
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }

        // Update map content when data changes
        if (mapInstanceRef.current) {
            // Clear existing layers
            layersRef.current.forEach(layer => {
                try {
                    mapInstanceRef.current?.removeLayer(layer);
                } catch (e) {
                    // Layer might already be removed
                }
            });
            layersRef.current = [];

            // Stop any running animation
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            if (busMarkerRef.current) {
                mapInstanceRef.current.removeLayer(busMarkerRef.current);
                busMarkerRef.current = null;
            }
            if (trailRef.current) {
                mapInstanceRef.current.removeLayer(trailRef.current);
                trailRef.current = null;
            }

            const positions = coordinates
                .filter(point => point && point.coords)
                .map(point => [point.coords.lat, point.coords.lng] as [number, number]);

            // Draw geometries
            const hasGeometries = geometries && geometries.length > 0;

            if (hasGeometries) {
                let fullRoutePoints: [number, number][] = [];

                geometries.forEach((geometry, idx) => {
                    if (!geometry || geometry.length < 2) return;

                    const segment = segments[idx];
                    const isWalk = segment?.mode === 'walk';

                    // Collect points for animation if it's a bus segment
                    if (!isWalk) {
                        fullRoutePoints = [...fullRoutePoints, ...geometry];
                    }

                    // Draw route polyline with better colors
                    const polyline = L.polyline(geometry, {
                        color: isWalk ? '#10b981' : '#f97316', // Green for walk, Orange for bus
                        weight: isWalk ? 4 : 6,
                        opacity: isWalk ? 0.7 : 0.9,
                        dashArray: isWalk ? '10, 10' : undefined,
                    }).addTo(mapInstanceRef.current!);

                    layersRef.current.push(polyline);

                    // Add markers for bus stops (boarding and alighting)
                    if (!isWalk && segment) {
                        // Boarding stop (green circle)
                        if (segment.from_coordinates) {
                            const boardingMarker = L.circleMarker(
                                [segment.from_coordinates.lat, segment.from_coordinates.lng],
                                {
                                    radius: 8,
                                    fillColor: '#10b981',
                                    color: '#ffffff',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.9
                                }
                            )
                                .addTo(mapInstanceRef.current!)
                                .bindPopup(`
                                    <div style="font-family: sans-serif;">
                                        <strong style="color: #10b981;">🚏 Lên xe</strong><br/>
                                        <span style="font-weight: 600;">${segment.lineName || 'Bus'}</span><br/>
                                        <span style="font-size: 0.9em;">${segment.fromStopName || 'Bus stop'}</span>
                                    </div>
                                `);
                            layersRef.current.push(boardingMarker);
                        }

                        // Alighting stop (bus icon - orange)
                        if (segment.to_coordinates) {
                            const alightingMarker = L.marker(
                                [segment.to_coordinates.lat, segment.to_coordinates.lng],
                                {
                                    icon: L.divIcon({
                                        html: `
                                            <div style="
                                                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                                                border: 3px solid white;
                                                border-radius: 50%;
                                                width: 36px;
                                                height: 36px;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                            ">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M8 6v6"/>
                                                    <path d="M15 6v6"/>
                                                    <path d="M2 12h19.6"/>
                                                    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
                                                    <circle cx="7" cy="18" r="2"/>
                                                    <circle cx="16" cy="18" r="2"/>
                                                </svg>
                                            </div>
                                        `,
                                        className: 'bus-marker-icon',
                                        iconSize: [36, 36],
                                        iconAnchor: [18, 18],
                                        popupAnchor: [0, -18]
                                    })
                                }
                            )
                                .addTo(mapInstanceRef.current!)
                                .bindPopup(`
                                    <div style="font-family: sans-serif;">
                                        <strong style="color: #f97316;">🚏 Xuống xe</strong><br/>
                                        <span style="font-weight: 600;">${segment.lineName || 'Bus'}</span><br/>
                                        <span style="font-size: 0.9em;">${segment.toStopName || 'Bus stop'}</span>
                                    </div>
                                `);
                            layersRef.current.push(alightingMarker);
                        }
                    }
                });

                // START 3D BUS ANIMATION
                if (fullRoutePoints.length > 1) {
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

                    busMarkerRef.current = L.marker(fullRoutePoints[0], {
                        icon: busIcon,
                        zIndexOffset: 1000
                    }).addTo(mapInstanceRef.current);

                    // Create Trail Polyline
                    trailRef.current = L.polyline([], {
                        color: '#f97316', // Orange trail to match bus color
                        weight: 6,
                        opacity: 0.6,
                        lineCap: 'round',
                        className: 'bus-light-trail'
                    }).addTo(mapInstanceRef.current);

                    // Animation Loop
                    let startTime: number | null = null;
                    const speed = 150; // meters per second (approx simulated speed)
                    let totalDistance = 0;
                    const distances: number[] = [0];

                    // Pre-calculate distances
                    for (let i = 0; i < fullRoutePoints.length - 1; i++) {
                        const d = getDistance(
                            fullRoutePoints[i][0], fullRoutePoints[i][1],
                            fullRoutePoints[i + 1][0], fullRoutePoints[i + 1][1]
                        );
                        totalDistance += d;
                        distances.push(totalDistance);
                    }

                    const duration = (totalDistance / speed) * 1000; // ms

                    const animate = (timestamp: number) => {
                        if (!startTime) startTime = timestamp;
                        const progress = (timestamp - startTime) % duration; // Loop forever
                        const currentDist = (progress / duration) * totalDistance;

                        // Find current segment
                        let i = 0;
                        while (i < distances.length - 1 && distances[i + 1] < currentDist) {
                            i++;
                        }

                        // Interpolate position
                        const segmentDist = distances[i + 1] - distances[i];
                        const segmentProgress = (currentDist - distances[i]) / segmentDist;

                        const p1 = fullRoutePoints[i];
                        const p2 = fullRoutePoints[i + 1];

                        if (p1 && p2) {
                            const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
                            const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
                            const newPos = new L.LatLng(lat, lng);

                            // Update Marker Position
                            busMarkerRef.current?.setLatLng(newPos);

                            // Update Bearing/Rotation
                            const bearing = getBearing(p1[0], p1[1], p2[0], p2[1]);
                            const markerElement = busMarkerRef.current?.getElement();
                            if (markerElement) {
                                const container = markerElement.querySelector('.bus-3d-container') as HTMLElement;
                                if (container) {
                                    container.style.transform = `rotate(${bearing}deg)`;
                                    // Adjust tilt based on view if possible, but for now simple rotation
                                }
                            }
                        }

                        animationRef.current = requestAnimationFrame(animate);
                    };

                    animationRef.current = requestAnimationFrame(animate);
                }
            }

            // Add markers with custom icons (Origin/Dest)
            coordinates.forEach((point, index) => {
                if (!point || !point.coords) return;

                let customIcon;
                if (index === 0) {
                    // Origin
                    customIcon = L.divIcon({
                        html: `
                            <div style="
                                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                border: 3px solid white;
                                border-radius: 50%;
                                width: 44px;
                                height: 44px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            ">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="8" r="5"/>
                                    <path d="M20 21a8 8 0 0 0-16 0"/>
                                </svg>
                            </div>
                        `,
                        className: 'custom-marker-icon',
                        iconSize: [44, 44],
                        iconAnchor: [22, 22],
                        popupAnchor: [0, -22]
                    });
                } else {
                    // Destination
                    customIcon = L.divIcon({
                        html: `
                            <div style="
                                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                border: 3px solid white;
                                border-radius: 50%;
                                width: 44px;
                                height: 44px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            ">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <path d="m9 11 3 3L22 4"/>
                                </svg>
                            </div>
                        `,
                        className: 'custom-marker-icon',
                        iconSize: [44, 44],
                        iconAnchor: [22, 22],
                        popupAnchor: [0, -22]
                    });
                }

                const marker = L.marker([point.coords.lat, point.coords.lng], { icon: customIcon })
                    .addTo(mapInstanceRef.current!)
                    .bindPopup(`<strong>${point.name || 'Location'}</strong>`);
                layersRef.current.push(marker);
            });

            // Fit bounds
            if (positions.length > 0) {
                try {
                    const bounds = L.latLngBounds(positions);
                    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
                } catch (e) {
                    console.warn('Could not fit bounds:', e);
                }
            }
        }

        // Cleanup function
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [coordinates, geometries, segments, onMapClick]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                } catch (e) {
                    console.error('Error cleaning up map:', e);
                }
            }
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !onMapClick) return;

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        };

        map.on('click', handleMapClick);

        // Cleanup
        return () => {
            map.off('click', handleMapClick);
        };
    }, [onMapClick]);

    return (
        <div
            ref={mapRef}
            className={`w-full h-full relative ${className || ''}`}
            style={{
                borderRadius: '12px',
                overflow: 'hidden'
            }}
        />
    );
}