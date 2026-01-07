/**
 * Script để import dữ liệu GTFS từ data/gtfs/ vào PostgreSQL database
 *
 * Usage:
 *   node scripts/import-gtfs-to-db.js
 *
 * Lưu ý:
 *   - Đảm bảo database đã được tạo và schema đã được migrate
 *   - Script sẽ xóa dữ liệu cũ trước khi import (có thể comment lại nếu không muốn)
 */

const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/sync").parse;
const prisma = require("../config/prisma");

const GTFS_DIR = path.join(__dirname, "../data/gtfs");

// Mapping GTFS route_type to our type
// GTFS route_type: 0=Tram, 1=Subway, 2=Rail, 3=Bus, 4=Ferry, 5=Cable, 6=Gondola, 7=Funicular
const ROUTE_TYPE_MAP = {
  0: "train",
  1: "train",
  2: "train",
  3: "bus",
  4: "bus",
  5: "bus",
  6: "bus",
  7: "bus",
};

// Default fare per route (VND)
const DEFAULT_FARE = 7000;

/**
 * Load và parse CSV file
 */
function loadCsv(filename) {
  const filePath = path.join(GTFS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ ${filename} not found`);
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records;
}

/**
 * Escape SQL string
 */
function escapeSql(str) {
  if (!str) return null;
  return str.replace(/'/g, "''");
}

/**
 * Convert time string (HH:MM:SS) to PostgreSQL TIME
 */
function convertTime(timeStr) {
  if (!timeStr || timeStr === "") return null;
  // GTFS time can be > 24:00:00 (e.g., 25:30:00 for next day)
  // PostgreSQL TIME only supports up to 24:00:00
  // We'll convert 25:30:00 to 01:30:00 (losing day info, but acceptable)
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0]);
  if (hours >= 24) {
    hours = hours % 24;
  }
  return `${hours.toString().padStart(2, "0")}:${parts[1]}:${parts[2] || "00"}`;
}

/**
 * Import stops
 */
async function importStops() {
  console.log("\n📥 Importing stops...");
  const stops = loadCsv("stops.txt");

  if (!stops || stops.length === 0) {
    console.log("  ⚠️  No stops found");
    return;
  }

  console.log(`  📊 Found ${stops.length} stops`);

  // Clear existing stops (optional - comment out if you want to keep old data)
  // await prisma.stop_times.deleteMany({});
  // await prisma.stops.deleteMany({});
  // console.log('  🗑️  Cleared existing stops');

  let imported = 0;
  let skipped = 0;

  for (const stop of stops) {
    try {
      const stopId = stop.stop_id;
      const stopName = stop.stop_name || stop.stop_desc || "Unknown Stop";
      const lat = parseFloat(stop.stop_lat);
      const lng = parseFloat(stop.stop_lon);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.log(`  ⚠️  Skipping stop ${stopId}: invalid coordinates`);
        skipped++;
        continue;
      }

      // Determine type (default to bus)
      const type = "bus"; // GTFS doesn't always have type per stop, default to bus

      await prisma.stops.upsert({
        where: { id: stopId },
        update: {
          name: stopName,
          lat: lat,
          lng: lng,
          type: type,
        },
        create: {
          id: stopId,
          name: stopName,
          lat: lat,
          lng: lng,
          type: type,
        },
      });

      imported++;
      if (imported % 100 === 0) {
        process.stdout.write(
          `  ✅ Imported ${imported}/${stops.length} stops\r`
        );
      }
    } catch (error) {
      console.error(
        `  ❌ Error importing stop ${stop.stop_id}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n  ✅ Successfully imported ${imported} stops`);
  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} stops`);
  }
}

/**
 * Import routes
 */
async function importRoutes() {
  console.log("\n📥 Importing routes...");
  const routes = loadCsv("routes.txt");

  if (!routes || routes.length === 0) {
    console.log("  ⚠️  No routes found");
    return;
  }

  console.log(`  📊 Found ${routes.length} routes`);

  // Clear existing routes (optional)
  // await prisma.trips.deleteMany({});
  // await prisma.routes.deleteMany({});
  // console.log('  🗑️  Cleared existing routes');

  let imported = 0;
  let skipped = 0;

  for (const route of routes) {
    try {
      const routeId = route.route_id;
      const shortName = route.route_short_name || null;
      const longName =
        route.route_long_name || route.route_desc || "Unknown Route";
      const routeType = ROUTE_TYPE_MAP[route.route_type] || "bus";

      // Determine forward_direction (simplified: routes ending with _1 are forward)
      const forwardDirection = routeId.endsWith("_1") || routeId.endsWith("_A");

      await prisma.routes.upsert({
        where: { id: routeId },
        update: {
          short_name: shortName,
          long_name: longName,
          type: routeType,
          fare: DEFAULT_FARE,
          forward_direction: forwardDirection,
        },
        create: {
          id: routeId,
          short_name: shortName,
          long_name: longName,
          type: routeType,
          fare: DEFAULT_FARE,
          forward_direction: forwardDirection,
        },
      });

      imported++;
      if (imported % 50 === 0) {
        process.stdout.write(
          `  ✅ Imported ${imported}/${routes.length} routes\r`
        );
      }
    } catch (error) {
      console.error(
        `  ❌ Error importing route ${route.route_id}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n  ✅ Successfully imported ${imported} routes`);
  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} routes`);
  }
}

/**
 * Import trips
 */
async function importTrips() {
  console.log("\n📥 Importing trips...");
  const trips = loadCsv("trips.txt");

  if (!trips || trips.length === 0) {
    console.log("  ⚠️  No trips found");
    return;
  }

  console.log(`  📊 Found ${trips.length} trips`);

  // Clear existing trips (optional)
  // await prisma.stop_times.deleteMany({});
  // await prisma.trips.deleteMany({});
  // console.log('  🗑️  Cleared existing trips');

  let imported = 0;
  let skipped = 0;

  for (const trip of trips) {
    try {
      const tripId = trip.trip_id;
      const routeId = trip.route_id;

      // Check if route exists
      const route = await prisma.routes.findUnique({
        where: { id: routeId },
      });

      if (!route) {
        console.log(
          `  ⚠️  Skipping trip ${tripId}: route ${routeId} not found`
        );
        skipped++;
        continue;
      }

      await prisma.trips.upsert({
        where: { trip_id: tripId },
        update: {
          route_id: routeId,
        },
        create: {
          trip_id: tripId,
          route_id: routeId,
        },
      });

      imported++;
      if (imported % 100 === 0) {
        process.stdout.write(
          `  ✅ Imported ${imported}/${trips.length} trips\r`
        );
      }
    } catch (error) {
      console.error(
        `  ❌ Error importing trip ${trip.trip_id}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n  ✅ Successfully imported ${imported} trips`);
  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} trips`);
  }
}

/**
 * Import stop_times
 */
async function importStopTimes() {
  console.log("\n📥 Importing stop_times...");
  const stopTimes = loadCsv("stop_times.txt");

  if (!stopTimes || stopTimes.length === 0) {
    console.log("  ⚠️  No stop_times found");
    return;
  }

  console.log(`  📊 Found ${stopTimes.length} stop_times`);

  // Clear existing stop_times (optional)
  // await prisma.stop_times.deleteMany({});
  // console.log('  🗑️  Cleared existing stop_times');

  let imported = 0;
  let skipped = 0;
  const batchSize = 1000;
  let batch = [];

  for (const stopTime of stopTimes) {
    try {
      const tripId = stopTime.trip_id;
      const stopId = stopTime.stop_id;
      const stopSequence = parseInt(stopTime.stop_sequence);

      // Validate
      if (!tripId || !stopId || isNaN(stopSequence)) {
        skipped++;
        continue;
      }

      // Check if trip exists
      const trip = await prisma.trips.findUnique({
        where: { trip_id: tripId },
      });

      if (!trip) {
        skipped++;
        continue;
      }

      // Check if stop exists
      const stop = await prisma.stops.findUnique({
        where: { id: stopId },
      });

      if (!stop) {
        skipped++;
        continue;
      }

      // Convert times
      const arrivalTime = convertTime(stopTime.arrival_time);
      const departureTime = convertTime(stopTime.departure_time);

      batch.push({
        trip_id: tripId,
        stop_id: stopId,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        stop_sequence: stopSequence,
      });

      // Insert in batches for better performance
      if (batch.length >= batchSize) {
        await prisma.stop_times.createMany({
          data: batch,
          skipDuplicates: true,
        });
        imported += batch.length;
        process.stdout.write(
          `  ✅ Imported ${imported}/${stopTimes.length} stop_times\r`
        );
        batch = [];
      }
    } catch (error) {
      console.error(`  ❌ Error importing stop_time:`, error.message);
      skipped++;
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await prisma.stop_times.createMany({
      data: batch,
      skipDuplicates: true,
    });
    imported += batch.length;
  }

  console.log(`\n  ✅ Successfully imported ${imported} stop_times`);
  if (skipped > 0) {
    console.log(`  ⚠️  Skipped ${skipped} stop_times`);
  }
}

/**
 * Main import function
 */
async function importGtfs() {
  console.log("\n🚀 GTFS Import Script");
  console.log("═".repeat(60));
  console.log(`📂 GTFS Directory: ${GTFS_DIR}`);
  console.log("═".repeat(60));

  try {
    // Check if GTFS files exist
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
      console.error("\n❌ Missing required GTFS files:");
      missingFiles.forEach((file) => console.error(`   - ${file}`));
      console.error("\nPlease ensure all GTFS files are in:", GTFS_DIR);
      process.exit(1);
    }

    // Import in order: stops -> routes -> trips -> stop_times
    await importStops();
    await importRoutes();
    await importTrips();
    await importStopTimes();

    console.log("\n" + "═".repeat(60));
    console.log("✅ Import completed successfully!");
    console.log("═".repeat(60));

    // Show summary
    const stopsCount = await prisma.stops.count();
    const routesCount = await prisma.routes.count();
    const tripsCount = await prisma.trips.count();
    const stopTimesCount = await prisma.stop_times.count();

    console.log("\n📊 Database Summary:");
    console.log(`   🚏 Stops: ${stopsCount}`);
    console.log(`   🚌 Routes: ${routesCount}`);
    console.log(`   🔄 Trips: ${tripsCount}`);
    console.log(`   ⏰ Stop Times: ${stopTimesCount}`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
if (require.main === module) {
  importGtfs();
}

module.exports = { importGtfs };
