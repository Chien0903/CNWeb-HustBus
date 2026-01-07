/**
 * Test FastAPI với tọa độ từ frontend
 */

const axios = require('axios');

async function testFastAPIFrontendCoords() {
  const apiUrl = 'http://127.0.0.1:8000/find_route';
  
  // Tọa độ từ frontend
  const params = {
    lat_from: 20.933735,
    lon_from: 105.670811,
    lat_to: 21.0528997,  // Tọa độ từ frontend
    lon_to: 105.7335701, // Tọa độ từ frontend
    time: '15:00:00',
    max_transfers: 3
  };

  console.log('\n🧪 Test FastAPI với tọa độ từ frontend:');
  console.log(JSON.stringify(params, null, 2));
  console.log('\n📡 URL:', `${apiUrl}?${new URLSearchParams(params).toString()}\n`);

  try {
    const response = await axios.get(apiUrl, {
      params,
      timeout: 15000
    });

    console.log('✅ Status:', response.status);
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      console.log(`\n🎉 Tìm thấy ${response.data.routes.length} lộ trình!`);
      console.log(`📋 Segments: ${response.data.segments?.length || 0}`);
    } else {
      console.log('\n⚠️  Không có routes trong response');
      console.log('💡 Có thể FastAPI không tìm thấy stops gần tọa độ này');
    }

  } catch (error) {
    console.error('\n❌ Lỗi:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   Không nhận được response');
      console.error('   Có thể FastAPI không chạy');
    } else {
      console.error('   Error:', error.message);
    }
  }

  // So sánh với tọa độ test
  console.log('\n\n' + '═'.repeat(80));
  console.log('\n🔍 So sánh với tọa độ test:\n');
  
  const testParams = {
    lat_from: 20.933735,
    lon_from: 105.670811,
    lat_to: 21.052936,  // Tọa độ test
    lon_to: 105.733674, // Tọa độ test
    time: '15:00:00',
    max_transfers: 3
  };

  console.log('Tọa độ frontend:', params.lat_to, params.lon_to);
  console.log('Tọa độ test:', testParams.lat_to, testParams.lon_to);
  
  // Tính khoảng cách
  const R = 6371;
  const dLat = ((testParams.lat_to - params.lat_to) * Math.PI) / 180;
  const dLon = ((testParams.lon_to - params.lon_to) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((params.lat_to * Math.PI) / 180) *
      Math.cos((testParams.lat_to * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // meters

  console.log(`Khoảng cách: ${distance.toFixed(2)} m`);
  
  if (distance > 100) {
    console.log(`\n⚠️  Khoảng cách khá xa (>100m). FastAPI có thể không tìm thấy routes với tọa độ này.`);
  }
}

testFastAPIFrontendCoords();

