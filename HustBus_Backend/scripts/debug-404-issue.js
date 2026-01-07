/**
 * Script để debug vấn đề 404 khi tìm lộ trình
 */

const axios = require("axios");
const { findNearestStops } = require("../utils/findpathUtils");
const config = require("../config/env.config");

async function debug404Issue() {
  console.log("\n🔍 Debug vấn đề 404 khi tìm lộ trình...\n");
  console.log("═".repeat(80));

  const testCase = {
    from: { lat: 20.933735, lng: 105.670811 },
    to: { lat: 21.052936, lng: 105.733674 },
    time: "15:00:00",
  };

  try {
    // 1. Kiểm tra tìm stops gần nhất
    console.log("\n📍 Bước 1: Tìm stops gần nhất từ điểm xuất phát...\n");
    const originStops = await findNearestStops(
      testCase.from.lat,
      testCase.from.lng,
      3
    );

    console.log(`✅ Tìm thấy ${originStops.length} stops gần nhất:`);
    originStops.forEach((stop, index) => {
      console.log(`   ${index + 1}. ${stop.name} (${stop.id})`);
      console.log(`      Tọa độ: ${stop.lat}, ${stop.lng}`);
      console.log(
        `      Khoảng cách: ${(stop.distance / 1000).toFixed(2)} km\n`
      );
    });

    // 2. Kiểm tra FastAPI trực tiếp
    console.log("\n🔗 Bước 2: Kiểm tra FastAPI trực tiếp...\n");
    const apiUrl = config.getRoutingApiUrl(
      config.externalApis.routingService.endpoints.findRoute
    );

    console.log(`📡 FastAPI URL: ${apiUrl}`);

    // Test với từng stop gần nhất
    let foundRoute = false;
    for (let i = 0; i < originStops.length; i++) {
      const stop = originStops[i];
      console.log(
        `\n🧪 Test ${i + 1}/${originStops.length}: ${stop.name} (${stop.id})`
      );
      console.log(`   Từ: ${stop.lat}, ${stop.lng}`);
      console.log(`   Đến: ${testCase.to.lat}, ${testCase.to.lng}`);
      console.log(`   Thời gian: ${testCase.time}`);

      try {
        const response = await axios.get(apiUrl, {
          params: {
            lat_from: stop.lat,
            lon_from: stop.lng,
            lat_to: testCase.to.lat,
            lon_to: testCase.to.lng,
            time: testCase.time,
            max_transfers: 3,
          },
          timeout: 15000,
        });

        console.log(`   ✅ FastAPI response status: ${response.status}`);

        if (
          response.data &&
          response.data.routes &&
          response.data.routes.length > 0
        ) {
          console.log(
            `   🎉 Tìm thấy ${response.data.routes.length} lộ trình!`
          );
          console.log(
            `   📊 Response summary:`,
            JSON.stringify(
              {
                routes_count: response.data.routes.length,
                first_route_summary: response.data.routes[0]?.summary,
                segments_count: response.data.segments?.length || 0,
              },
              null,
              2
            )
          );
          foundRoute = true;
          break;
        } else {
          console.log(`   ⚠️  FastAPI không trả về lộ trình nào`);
          if (response.data) {
            console.log(
              `   📊 Response data:`,
              JSON.stringify(response.data, null, 2)
            );
          }
        }
      } catch (error) {
        console.error(`   ❌ Lỗi khi gọi FastAPI:`);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(
            `      Data:`,
            JSON.stringify(error.response.data, null, 2)
          );
        } else if (error.request) {
          console.error(`      Không nhận được response từ FastAPI`);
        } else {
          console.error(`      Error: ${error.message}`);
        }
      }
    }

    // 3. Test với tọa độ gốc (không qua stops)
    console.log(`\n\n${"═".repeat(80)}`);
    console.log("\n🔍 Bước 3: Test với tọa độ gốc (không qua stops)...\n");

    try {
      const response = await axios.get(apiUrl, {
        params: {
          lat_from: testCase.from.lat,
          lon_from: testCase.from.lng,
          lat_to: testCase.to.lat,
          lon_to: testCase.to.lng,
          time: testCase.time,
          max_transfers: 3,
        },
        timeout: 15000,
      });

      console.log(`✅ FastAPI response status: ${response.status}`);

      if (
        response.data &&
        response.data.routes &&
        response.data.routes.length > 0
      ) {
        console.log(
          `🎉 Tìm thấy ${response.data.routes.length} lộ trình với tọa độ gốc!`
        );
        foundRoute = true;
      } else {
        console.log(`⚠️  FastAPI không trả về lộ trình với tọa độ gốc`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi gọi FastAPI với tọa độ gốc:`, error.message);
    }

    // 4. Test với các thời gian khác
    console.log(`\n\n${"═".repeat(80)}`);
    console.log("\n🔍 Bước 4: Test với các thời gian khác...\n");

    const testTimes = ["13:30:00", "14:15:00", "15:45:00", "16:30:00"];
    const testStop = originStops[0];

    for (const testTime of testTimes) {
      console.log(`\n🧪 Test với thời gian: ${testTime}`);

      try {
        const response = await axios.get(apiUrl, {
          params: {
            lat_from: testStop.lat,
            lon_from: testStop.lng,
            lat_to: testCase.to.lat,
            lon_to: testCase.to.lng,
            time: testTime,
            max_transfers: 3,
          },
          timeout: 15000,
        });

        if (
          response.data &&
          response.data.routes &&
          response.data.routes.length > 0
        ) {
          console.log(
            `   ✅ Tìm thấy ${response.data.routes.length} lộ trình với thời gian ${testTime}`
          );
          foundRoute = true;
        } else {
          console.log(
            `   ⚠️  Không tìm thấy lộ trình với thời gian ${testTime}`
          );
        }
      } catch (error) {
        console.log(`   ❌ Lỗi với thời gian ${testTime}: ${error.message}`);
      }
    }

    // 5. Tóm tắt
    console.log(`\n\n${"═".repeat(80)}`);
    console.log("\n📊 TÓM TẮT:\n");

    if (foundRoute) {
      console.log("✅ FastAPI có thể tìm thấy lộ trình");
      console.log("⚠️  Vấn đề có thể nằm ở Node.js backend xử lý response");
    } else {
      console.log("❌ FastAPI không tìm thấy lộ trình với các tham số này");
      console.log("💡 Có thể cần kiểm tra:");
      console.log("   - Thời gian có đúng không");
      console.log("   - Stops có tồn tại trong database không");
      console.log("   - Có trips nào đi qua cả 2 stops không");
    }
  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  }
}

// Run
debug404Issue();
