/**
 * Kiểm tra xem các stops từ FastAPI response có tồn tại trong database không
 */

const prisma = require('../config/prisma');

async function checkStopsExist() {
  const stopsToCheck = ['57_2_S1', '57_2_S43'];

  console.log('\n🔍 Kiểm tra stops có tồn tại trong database...\n');

  for (const stopId of stopsToCheck) {
    const stop = await prisma.stops.findUnique({
      where: { id: stopId }
    });

    if (stop) {
      console.log(`✅ ${stopId}: ${stop.name}`);
      console.log(`   Tọa độ: ${stop.lat}, ${stop.lng}\n`);
    } else {
      console.log(`❌ ${stopId}: KHÔNG TỒN TẠI\n`);
    }
  }

  await prisma.$disconnect();
}

checkStopsExist();

