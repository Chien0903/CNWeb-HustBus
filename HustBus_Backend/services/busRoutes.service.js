const routesRepo = require('../repositories/routes.repo');
const tripsRepo = require('../repositories/trips.repo');
const stopTimesRepo = require('../repositories/stopTimes.repo');

module.exports = {
  async search(query) {
    const routes = await routesRepo.searchByName(query || "");

    // Dedupe by long_name so each bus line appears once (forward/backward are 2 DB rows).
    // FE expects: route.name and route.sampleId||route.id (used for delete/reviews).
    const map = new Map();

    for (const route of routes) {
      const key = (route.long_name || route.id || "").trim().toLowerCase();
      if (!key) continue;

      const existing = map.get(key);
      const isPreferredSample = route.forward_direction === true; // prefer "forward" if available

      if (!existing || isPreferredSample) {
        map.set(key, {
          // For list UI
          id: route.id,
          sampleId: route.id,
          name: route.long_name || route.id,
          // Avoid GTFS noise like "n/a-02_1"
          description: route.id,

          // For admin edit form (optional fields)
          short_name: route.short_name || null,
          long_name: route.long_name || null,
          type: route.type || null,
          fare: route.fare ?? null,
          forward_direction: route.forward_direction ?? null,
        });
      }
    }

    return Array.from(map.values());
  },

  async getLineDetails(name) {
    const routes = await routesRepo.findByName(name);
    if (!routes || routes.length === 0) return null;

    // routes should contain 2 entries typically: forward and backward
    const directions = await Promise.all(routes.map(async (route) => {
      // Find a representative trip for this route to get the stops
      const trips = await tripsRepo.getByRouteId(route.id);
      if (!trips || trips.length === 0) return null;

      // Pick the first trip
      const trip = trips[0];
      const stopTimes = await stopTimesRepo.getFullSchedule(trip.trip_id);

      return {
        route_id: route.id,
        direction: route.forward_direction ? 'forward' : 'backward', // Assuming boolean or checking value
        // In DB it is boolean? let's check schema.
        // schema says forward_direction Boolean?
        // csv shows 'TRUE'/'FALSE'. Prisma maps to boolean.
        // Friendly label instead of GTFS short_name like "n/a-02_1"
        headsign: route.forward_direction ? `Chiều đi (${route.id})` : `Chiều về (${route.id})`,
        stops: stopTimes.map(st => st.stops)
      };
    }));

    return {
      name: name,
      directions: directions.filter(d => d !== null)
    };
  },

  async getSchedule(routeId) {
    const trips = await tripsRepo.getByRouteId(routeId);
    // For each trip, we want start time and end time? 
    // Or just list of trips.
    // User asked for "Lịch trình của tuyến buýt đó".
    // Usually this means list of trips and their times.
    // We can sort by start time.
    // This might be heavy if we fetch stop times for ALL trips.
    // But let's assume we just want trip info.
    // detailed schedule might need all stops.
    // For now, let's return list of trips with their first stop time.

    // Optimization: tripsRepo.getAll() includes stop_times.
    // getByRouteId includes stop_times.

    const formattedTrips = trips.map(trip => {
      const sortedStopTimes = trip.stop_times.sort((a, b) => a.stop_sequence - b.stop_sequence);
      const first = sortedStopTimes[0];
      const last = sortedStopTimes[sortedStopTimes.length - 1];
      return {
        trip_id: trip.trip_id,
        start_time: first?.departure_time || first?.arrival_time,
        end_time: last?.arrival_time || last?.departure_time
      };
    });

    // Sort by start time
    return formattedTrips.sort((a, b) => {
      const t1 = new Date(a.start_time).getTime();
      const t2 = new Date(b.start_time).getTime();
      return t1 - t2;
    });
  },

  async createRoute(data) {
    // Keep only fields that exist in Prisma schema.
    const payload = {
      id: data.id,
      short_name: data.short_name ?? null,
      long_name: data.long_name ?? null,
      type: data.type ?? null,
      fare: typeof data.fare === "number" ? data.fare : null,
      forward_direction:
        typeof data.forward_direction === "boolean" ? data.forward_direction : null,
    };
    return routesRepo.create(payload);
  },

  async updateRoute(id, data) {
    const payload = {
      short_name: data.short_name ?? undefined,
      long_name: data.long_name ?? undefined,
      type: data.type ?? undefined,
      fare: typeof data.fare === "number" ? data.fare : undefined,
      forward_direction:
        typeof data.forward_direction === "boolean" ? data.forward_direction : undefined,
    };
    return routesRepo.update(id, payload);
  },

  async deleteRoute(id) {
    return routesRepo.delete(id);
  }
};
