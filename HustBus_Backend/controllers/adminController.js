const prisma = require("../config/prisma");

exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        reviews: { select: { id: true } },
        saved_routes: { select: { id: true } },
      },
      take: 200,
    });

    const mapped = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      reviewsCount: u.reviews.length,
      savedRoutesCount: u.saved_routes.length,
    }));

    res.json({ users: mapped });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Không thể tải danh sách người dùng." });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Thiếu id người dùng." });
  }

  try {
    await prisma.users.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.status(500).json({ message: "Không thể xoá người dùng." });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalRoutes, totalStops, totalReviews] =
      await Promise.all([
        prisma.users.count(),
        prisma.routes.count(),
        prisma.stops.count(),
        prisma.reviews.count(),
      ]);

    res.json({
      totalUsers,
      totalRoutes,
      totalStops,
      totalReviews,
    });
  } catch (err) {
    console.error("Get admin stats error:", err);
    res.status(500).json({ message: "Không thể tải thống kê." });
  }
};

exports.listRoutes = async (req, res) => {
  try {
    const { q } = req.query; // Search query (optional)

    let whereClause = {};

    // Nếu có query search, tìm theo tên tuyến
    if (q && q.trim()) {
      whereClause = {
        OR: [
          { long_name: { contains: q, mode: "insensitive" } },
          { short_name: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const routes = await prisma.routes.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
      select: {
        id: true,
        short_name: true,
        long_name: true,
        type: true,
        fare: true,
        forward_direction: true,
        _count: {
          select: { trips: true },
        },
      },
      take: 500, // Limit to 500 routes
    });

    // Format response để phù hợp với frontend
    const formattedRoutes = routes.map((route) => {
      // Format description: hiển thị hướng đi thay vì short_name không có ý nghĩa
      const directionText = route.forward_direction ? "Chiều đi" : "Chiều về";
      const tripsText =
        route._count.trips > 0 ? `${route._count.trips} chuyến` : "";
      const description = [directionText, tripsText]
        .filter(Boolean)
        .join(" • ");

      return {
        id: route.id,
        name: route.long_name || route.short_name || route.id,
        description: description || route.id, // Fallback về id nếu không có gì
        type: route.type,
        fare: route.fare,
        direction: directionText,
        tripsCount: route._count.trips,
      };
    });

    res.json({
      routes: formattedRoutes,
      total: formattedRoutes.length,
    });
  } catch (err) {
    console.error("List routes error:", err);
    res.status(500).json({ message: "Không thể tải danh sách tuyến buýt." });
  }
};