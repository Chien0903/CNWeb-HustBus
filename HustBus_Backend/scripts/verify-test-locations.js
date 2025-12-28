/**
 * Script để kiểm tra xem các địa điểm test có tồn tại và có thể kết nối được không
 * 
 * Usage:
 *   node scripts/verify-test-locations.js
 */

const prisma = require('../config/prisma');

async function verifyTestLocations() {
  console.log('\n🔍 Kiểm tra các địa điểm test...\n');
  console.log('═'.repeat(80));

  const testCases = [
    {
      name: 'Test 1: Khoảng cách ngắn',
      from: { lat: 20.933735, lng: 105.670811, stopId: '57_2_S1' },
      to: { lat: 20.9285, lng: 105.685476, stopId: '57_2_S4' },
      time: '13:30:00'
    },
    {
      name: 'Test 2: Khoảng cách trung bình',
      from: { lat: 20.933735, lng: 105.670811, stopId: '57_2_S1' },
      to: { lat: 20.950059, lng: 105.747245, stopId: '57_2_S10' },
      time: '14:00:00'
    },
    {
      name: 'Test 3: Khoảng cách dài',
      from: { lat: 20.933735, lng: 105.670811, stopId: '57_2_S1' },
      to: { lat: 20.967434, lng: 105.771242, stopId: '57_2_S21' },
      time: '16:30:00'
    }
  ];

  try {
    for (const testCase of testCases) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`\n📍 ${testCase.name}`);
      console.log(`\n🚌 Điểm xuất phát:`);
      console.log(`   Stop ID: ${testCase.from.stopId}`);
      console.log(`   Tọa độ: ${testCase.from.lat}, ${testCase.from.lng}`);

      // Kiểm tra stop có tồn tại không
      const fromStop = await prisma.stops.findUnique({
        where: { id: testCase.from.stopId }
      });

      if (!fromStop) {
        console.log(`   ❌ Stop không tồn tại trong database!`);
        continue;
      }

      console.log(`   ✅ Stop tồn tại: ${fromStop.name}`);
      console.log(`   📍 Tọa độ DB: ${fromStop.lat}, ${fromStop.lng}`);

      // Kiểm tra có trips nào đi qua stop này không
      const fromStopTimes = await prisma.stop_times.findMany({
        where: { stop_id: testCase.from.stopId },
        include: { trips: true },
        take: 5
      });

      console.log(`   📊 Số trips đi qua: ${fromStopTimes.length}`);

      if (fromStopTimes.length > 0) {
        console.log(`   🚌 Một số trips:`);
        fromStopTimes.slice(0, 3).forEach(st => {
          console.log(`      - ${st.trip_id} (Route: ${st.trips.route_id})`);
        });
      }

      console.log(`\n🎯 Điểm đến:`);
      console.log(`   Stop ID: ${testCase.to.stopId}`);
      console.log(`   Tọa độ: ${testCase.to.lat}, ${testCase.to.lng}`);

      const toStop = await prisma.stops.findUnique({
        where: { id: testCase.to.stopId }
      });

      if (!toStop) {
        console.log(`   ❌ Stop không tồn tại trong database!`);
        continue;
      }

      console.log(`   ✅ Stop tồn tại: ${toStop.name}`);
      console.log(`   📍 Tọa độ DB: ${toStop.lat}, ${toStop.lng}`);

      // Kiểm tra có trips nào đi qua cả 2 stops không
      const commonTrips = await prisma.$queryRaw`
        SELECT DISTINCT st1.trip_id, t.route_id
        FROM stop_times st1
        JOIN stop_times st2 ON st1.trip_id = st2.trip_id
        JOIN trips t ON st1.trip_id = t.trip_id
        WHERE st1.stop_id = ${testCase.from.stopId}
          AND st2.stop_id = ${testCase.to.stopId}
          AND st1.stop_sequence < st2.stop_sequence
        LIMIT 5
      `;

      console.log(`\n🔗 Kết nối:`);
      console.log(`   📊 Số trips đi qua cả 2 stops: ${commonTrips.length}`);

      if (commonTrips.length > 0) {
        console.log(`   ✅ Có thể kết nối!`);
        console.log(`   🚌 Một số trips:`);
        commonTrips.forEach(trip => {
          console.log(`      - ${trip.trip_id} (Route: ${trip.route_id})`);
        });

        // Kiểm tra thời gian
        const tripWithTime = await prisma.$queryRaw`
          SELECT 
            st1.trip_id,
            st1.departure_time as from_time,
            st2.arrival_time as to_time,
            st1.stop_sequence as from_seq,
            st2.stop_sequence as to_seq
          FROM stop_times st1
          JOIN stop_times st2 ON st1.trip_id = st2.trip_id
          WHERE st1.stop_id = ${testCase.from.stopId}
            AND st2.stop_id = ${testCase.to.stopId}
            AND st1.stop_sequence < st2.stop_sequence
            AND st1.departure_time >= ${testCase.time}::TIME
          ORDER BY st1.departure_time ASC
          LIMIT 3
        `;

        console.log(`\n⏰ Thời gian khởi hành từ ${testCase.time}:`);
        if (tripWithTime.length > 0) {
          console.log(`   ✅ Có ${tripWithTime.length} trips khởi hành sau ${testCase.time}`);
          tripWithTime.forEach(t => {
            console.log(`      - Trip ${t.trip_id}: ${t.from_time} → ${t.to_time} (Sequence: ${t.from_seq} → ${t.to_seq})`);
          });
        } else {
          console.log(`   ⚠️  Không có trip nào khởi hành sau ${testCase.time}`);
          
          // Tìm thời gian gần nhất
          const nearestTime = await prisma.$queryRaw`
            SELECT 
              st1.trip_id,
              st1.departure_time as from_time,
              st2.arrival_time as to_time
            FROM stop_times st1
            JOIN stop_times st2 ON st1.trip_id = st2.trip_id
            WHERE st1.stop_id = ${testCase.from.stopId}
              AND st2.stop_id = ${testCase.to.stopId}
              AND st1.stop_sequence < st2.stop_sequence
            ORDER BY st1.departure_time ASC
            LIMIT 5
          `;

          if (nearestTime.length > 0) {
            console.log(`   💡 Các thời gian khởi hành có sẵn:`);
            nearestTime.forEach(t => {
              console.log(`      - ${t.from_time} → ${t.to_time}`);
            });
          }
        }
      } else {
        console.log(`   ❌ Không có trip nào đi qua cả 2 stops này!`);
      }
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log('\n✅ Hoàn tất kiểm tra!\n');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
verifyTestLocations();

