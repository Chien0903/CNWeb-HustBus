/**
 * Script đơn giản để test FastAPI với các tham số cụ thể
 */

const axios = require("axios");

async function testFastAPI() {
  const apiUrl = "http://127.0.0.1:8000/find_route";

  const params = {
    lat_from: 20.933735,
    lon_from: 105.670811,
    lat_to: 21.052936,
    lon_to: 105.733674,
    time: "15:00:00",
    max_transfers: 3,
  };

  console.log("\n🧪 Test FastAPI với tham số:");
  console.log(JSON.stringify(params, null, 2));
  console.log(
    "\n📡 URL:",
    `${apiUrl}?${new URLSearchParams(params).toString()}\n`
  );

  try {
    const response = await axios.get(apiUrl, {
      params,
      timeout: 15000,
    });

    console.log("✅ Status:", response.status);
    console.log("📊 Response data:");
    console.log(JSON.stringify(response.data, null, 2));

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      console.log(`\n🎉 Tìm thấy ${response.data.routes.length} lộ trình!`);
      console.log(`📋 Segments: ${response.data.segments?.length || 0}`);
    } else {
      console.log("\n⚠️  Không có routes trong response");
    }
  } catch (error) {
    console.error("\n❌ Lỗi:");
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("   Không nhận được response");
      console.error("   Có thể FastAPI không chạy");
    } else {
      console.error("   Error:", error.message);
    }
  }
}

testFastAPI();
