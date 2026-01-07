/**
 * Script để kiểm tra thời gian thực tế trong database
 */

const prisma = require('../config/prisma');

async function checkActualTimes() {
  console.log('\n⏰ Kiểm tra thời gian thực tế trong database...\n');

  try {
    // Lấy một số trips từ tuyến 57_2
    const stopTimes = await prisma.$queryRaw`
      SELECT 
        st.trip_id,
        st.stop_sequence,
        st.departure_time,
        st.arrival_time,
        s.id as stop_id,
        s.name as stop_name
      FROM stop_times st
      JOIN stops s ON st.stop_id = s.id
      WHERE st.trip_id LIKE '57_2_%'
        AND s.id IN ('57_2_S1', '57_2_S4', '57_2_S10', '57_2_S21')
      ORDER BY st.trip_id, st.stop_sequence
      LIMIT 20
    `;

    console.log('📊 Thời gian trong database:\n');
    
    const trips = {};
    stopTimes.forEach(st => {
      if (!trips[st.trip_id]) {
        trips[st.trip_id] = [];
      }
      trips[st.trip_id].push(st);
    });

    Object.keys(trips).slice(0, 5).forEach(tripId => {
      console.log(`\n🚌 Trip: ${tripId}`);
      trips[tripId].forEach(st => {
        const depTime = st.departure_time;
        const arrTime = st.arrival_time;
        
        // Format time
        let depStr = 'N/A';
        let arrStr = 'N/A';
        
        if (depTime) {
          if (depTime instanceof Date) {
            const hours = String(depTime.getHours()).padStart(2, '0');
            const minutes = String(depTime.getMinutes()).padStart(2, '0');
            const seconds = String(depTime.getSeconds()).padStart(2, '0');
            depStr = `${hours}:${minutes}:${seconds}`;
          } else if (typeof depTime === 'string') {
            depStr = depTime.substring(0, 8);
          }
        }
        
        if (arrTime) {
          if (arrTime instanceof Date) {
            const hours = String(arrTime.getHours()).padStart(2, '0');
            const minutes = String(arrTime.getMinutes()).padStart(2, '0');
            const seconds = String(arrTime.getSeconds()).padStart(2, '0');
            arrStr = `${hours}:${minutes}:${seconds}`;
          } else if (typeof arrTime === 'string') {
            arrStr = arrTime.substring(0, 8);
          }
        }
        
        console.log(`   Stop ${st.stop_sequence} (${st.stop_id}): ${depStr} → ${arrStr}`);
      });
    });

    // Tìm các thời gian khởi hành từ stop 57_2_S1
    console.log('\n\n📅 Các thời gian khởi hành từ STOP_57_2_S1:\n');
    
    const departureTimes = await prisma.$queryRaw`
      SELECT DISTINCT
        st.departure_time,
        st.trip_id
      FROM stop_times st
      WHERE st.stop_id = '57_2_S1'
        AND st.departure_time IS NOT NULL
      ORDER BY st.departure_time ASC
      LIMIT 20
    `;

    departureTimes.forEach(dt => {
      const time = dt.departure_time;
      let timeStr = 'N/A';
      
      if (time instanceof Date) {
        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        const seconds = String(time.getSeconds()).padStart(2, '0');
        timeStr = `${hours}:${minutes}:${seconds}`;
      } else if (typeof time === 'string') {
        timeStr = time.substring(0, 8);
      }
      
      console.log(`   ${timeStr} - Trip: ${dt.trip_id}`);
    });

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualTimes();

