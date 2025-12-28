/**
 * Test FastAPI với các thời gian khác nhau để tìm thời gian phù hợp
 */

const axios = require('axios');

async function testWithDifferentTimes() {
  const apiUrl = 'http://127.0.0.1:8000/find_route';
  
  const baseParams = {
    lat_from: 20.933735,
    lon_from: 105.670811,
    lat_to: 21.0528997,
    lon_to: 105.7335701,
    max_transfers: 3
  };

  // Test với các thời gian khác nhau
  const testTimes = [
    '13:30:00',
    '14:00:00',
    '14:15:00',
    '14:30:00',
    '15:00:00',
    '15:15:00',
    '15:30:00',
    '16:00:00',
    '16:30:00',
    '17:00:00'
  ];

  console.log('\n🧪 Test FastAPI với các thời gian khác nhau...\n');
  console.log('═'.repeat(80));

  const results = [];

  for (const time of testTimes) {
    const params = { ...baseParams, time };
    
    try {
      const response = await axios.get(apiUrl, {
        params,
        timeout: 10000
      });

      const hasRoutes = response.data && response.data.routes && response.data.routes.length > 0;
      
      if (hasRoutes) {
        console.log(`✅ ${time}: Tìm thấy ${response.data.routes.length} lộ trình`);
        results.push({ time, success: true, routes: response.data.routes.length });
      } else {
        console.log(`❌ ${time}: Không tìm thấy lộ trình`);
        results.push({ time, success: false, routes: 0 });
      }

    } catch (error) {
      console.log(`❌ ${time}: Lỗi - ${error.message}`);
      results.push({ time, success: false, error: error.message });
    }
  }

  console.log(`\n${'═'.repeat(80)}`);
  console.log('\n📊 Tóm tắt:\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Thành công: ${successful.length}/${results.length}`);
  if (successful.length > 0) {
    console.log(`\n⏰ Các thời gian tìm thấy lộ trình:`);
    successful.forEach(r => {
      console.log(`   - ${r.time} (${r.routes} lộ trình)`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Thất bại: ${failed.length}/${results.length}`);
    console.log(`\n⏰ Các thời gian không tìm thấy:`);
    failed.forEach(r => {
      console.log(`   - ${r.time}`);
    });
  }
}

testWithDifferentTimes();

