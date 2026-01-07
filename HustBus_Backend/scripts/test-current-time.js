/**
 * Test xem thời gian hiện tại có hợp lệ không
 */

const currentTime = new Date().toLocaleTimeString('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

console.log('\n⏰ Thời gian hiện tại (Vietnam timezone):');
console.log(`   ${currentTime}\n`);

// Parse để kiểm tra format
const timeParts = currentTime.split(':');
const hours = parseInt(timeParts[0]);
const minutes = parseInt(timeParts[1]);
const seconds = parseInt(timeParts[2]);

console.log(`📊 Phân tích:`);
console.log(`   Giờ: ${hours}`);
console.log(`   Phút: ${minutes}`);
console.log(`   Giây: ${seconds}\n`);

if (hours < 5 || hours >= 23) {
  console.log(`⚠️  Thời gian ngoài giờ hoạt động (05:00 - 23:00)`);
  console.log(`   Có thể không có trips khởi hành vào thời gian này\n`);
} else {
  console.log(`✅ Thời gian trong giờ hoạt động\n`);
}

// Test với thời gian này
const axios = require('axios');

async function testWithCurrentTime() {
  const apiUrl = 'http://127.0.0.1:8000/find_route';
  
  const params = {
    lat_from: 20.933735,
    lon_from: 105.670811,
    lat_to: 21.0528997,
    lon_to: 105.7335701,
    time: currentTime,
    max_transfers: 3
  };

  console.log(`🧪 Test FastAPI với thời gian hiện tại: ${currentTime}\n`);

  try {
    const response = await axios.get(apiUrl, {
      params,
      timeout: 10000
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      console.log(`✅ Tìm thấy ${response.data.routes.length} lộ trình với thời gian hiện tại`);
    } else {
      console.log(`❌ Không tìm thấy lộ trình với thời gian hiện tại`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error(`❌ Lỗi:`, error.message);
  }
}

testWithCurrentTime();

