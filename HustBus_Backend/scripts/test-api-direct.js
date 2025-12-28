/**
 * Script để test API tìm lộ trình trực tiếp
 */

const axios = require('axios');
const { findNearestStops } = require('../utils/findpathUtils');

async function testAPIDirect() {
  console.log('\n🧪 Test API tìm lộ trình trực tiếp...\n');
  console.log('═'.repeat(80));

  const testCase = {
    from: { lat: 20.933735, lng: 105.670811 },
    to: { lat: 20.9285, lng: 105.685476 },
    time: '13:30:00'
  };

  try {
    // 1. Kiểm tra tìm stops gần nhất
    console.log('\n📍 Bước 1: Tìm stops gần nhất từ điểm xuất phát...\n');
    const originStops = await findNearestStops(
      testCase.from.lat,
      testCase.from.lng,
      3
    );

    console.log(`✅ Tìm thấy ${originStops.length} stops gần nhất:`);
    originStops.forEach((stop, index) => {
      console.log(`   ${index + 1}. ${stop.name} (${stop.id})`);
      console.log(`      Tọa độ: ${stop.lat}, ${stop.lng}`);
      console.log(`      Khoảng cách: ${(stop.distance / 1000).toFixed(2)} km\n`);
    });

    // 2. Kiểm tra FastAPI
    console.log('\n🔗 Bước 2: Kiểm tra FastAPI service...\n');
    const config = require('../config/env.config');
    const apiUrl = config.getRoutingApiUrl(config.externalApis.routingService.endpoints.findRoute);
    
    console.log(`📡 FastAPI URL: ${apiUrl}`);

    // Test với stop đầu tiên
    const testStop = originStops[0];
    console.log(`\n🧪 Test với stop: ${testStop.name} (${testStop.id})`);
    console.log(`   Từ: ${testStop.lat}, ${testStop.lng}`);
    console.log(`   Đến: ${testCase.to.lat}, ${testCase.to.lng}`);
    console.log(`   Thời gian: ${testCase.time}`);

    try {
      const response = await axios.get(apiUrl, {
        params: {
          lat_from: testStop.lat,
          lon_from: testStop.lng,
          lat_to: testCase.to.lat,
          lon_to: testCase.to.lng,
          time: testCase.time,
          max_transfers: 2
        },
        timeout: 10000
      });

      console.log(`\n✅ FastAPI response status: ${response.status}`);
      console.log(`📊 Response data:`, JSON.stringify(response.data, null, 2));

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        console.log(`\n🎉 Tìm thấy ${response.data.routes.length} lộ trình!`);
      } else {
        console.log(`\n⚠️  FastAPI không trả về lộ trình nào`);
      }

    } catch (error) {
      console.error(`\n❌ Lỗi khi gọi FastAPI:`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error(`   Không nhận được response từ FastAPI`);
        console.error(`   Có thể FastAPI không chạy hoặc URL sai`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
    }

    // 3. Test với tất cả stops
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log('\n🔍 Bước 3: Test với tất cả stops gần nhất...\n');

    for (let i = 0; i < originStops.length; i++) {
      const stop = originStops[i];
      console.log(`\n🧪 Test ${i + 1}/${originStops.length}: ${stop.name} (${stop.id})`);

      try {
        const response = await axios.get(apiUrl, {
          params: {
            lat_from: stop.lat,
            lon_from: stop.lng,
            lat_to: testCase.to.lat,
            lon_to: testCase.to.lng,
            time: testCase.time,
            max_transfers: 2
          },
          timeout: 10000
        });

        if (response.data && response.data.routes && response.data.routes.length > 0) {
          console.log(`   ✅ Tìm thấy ${response.data.routes.length} lộ trình!`);
        } else {
          console.log(`   ⚠️  Không tìm thấy lộ trình`);
        }

      } catch (error) {
        if (error.response) {
          console.log(`   ❌ Lỗi ${error.response.status}: ${error.response.statusText}`);
        } else {
          console.log(`   ❌ Lỗi: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
  }
}

// Run
testAPIDirect();

