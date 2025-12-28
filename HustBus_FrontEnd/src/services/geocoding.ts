/**
 * Geocoding service using Nominatim API (OpenStreetMap)
 * Free API, no key required
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Limit search to Hanoi and surrounding areas
const HANOI_BOUNDS = {
    viewbox: '105.3,20.7,106.0,21.4', // [minLon,minLat,maxLon,maxLat]
    bounded: '1', // Prioritize results in bounds
};

export interface Place {
    id: string;
    name: string;
    shortName: string;
    coords: { lat: number; lng: number };
    address: any;
    type: string;
    importance: number;
}

/**
 * Search for places by query string
 */
export const searchPlaces = async (query: string): Promise<Place[]> => {
    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '8',
            countrycodes: 'vn', // Only search in Vietnam
            ...HANOI_BOUNDS,
            'accept-language': 'vi',
        });

        const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
            headers: {
                'User-Agent': 'HanoiTransit/1.0', // Nominatim requires User-Agent
            },
        });

        if (!response.ok) {
            throw new Error('Cannot search for places');
        }

        const data = await response.json();

        return data.map((place: any) => ({
            id: place.place_id,
            name: place.display_name,
            shortName: formatShortName(place),
            coords: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
            address: place.address || {},
            type: place.type,
            importance: place.importance,
        }));
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
};

/**
 * Reverse geocoding - Get address from coordinates
 */
export const reverseGeocode = async (coords: [number, number]): Promise<Place> => {
    try {
        const [lat, lon] = coords;
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            format: 'json',
            addressdetails: '1',
            'accept-language': 'vi',
        });

        const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
            headers: {
                'User-Agent': 'HanoiTransit/1.0',
            },
        });

        if (!response.ok) {
            throw new Error('Cannot determine address');
        }

        const data = await response.json();

        return {
            id: data.place_id,
            name: data.display_name,
            shortName: formatShortName(data),
            coords: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) },
            address: data.address || {},
            type: data.type,
            importance: data.importance || 0,
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw error;
    }
};

/**
 * Format shorter name from address data
 */
function formatShortName(place: any): string {
    const addr = place.address || {};

    // Priority: specific place name > road > district
    const parts = [
        addr.amenity,
        addr.building,
        addr.tourism,
        addr.road,
        addr.suburb,
        addr.district,
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.slice(0, 2).join(', ');
    }

    // Fallback to shortened display_name
    const fullName = place.display_name || '';
    const tokens = fullName.split(',').slice(0, 3);
    return tokens.join(',');
}
