/**
 * Bus routes controller (Express handlers)
 * NOTE: Keep this file focused on HTTP (req/res). Business logic lives in services.
 */

const busRoutesService = require("../services/busRoutes.service");

exports.search = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const routes = await busRoutesService.search(q);
    return res.json(routes);
  } catch (error) {
    console.error("bus-lines search error:", error);
    return res.status(500).json({ message: "Không thể tải danh sách tuyến buýt." });
  }
};

exports.getLineDetails = async (req, res) => {
  try {
    const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
    if (!name) {
      return res.status(400).json({ message: "Thiếu tham số name." });
    }
    const details = await busRoutesService.getLineDetails(name);
    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy tuyến buýt." });
    }
    return res.json(details);
  } catch (error) {
    console.error("bus-lines details error:", error);
    return res.status(500).json({ message: "Không thể tải chi tiết tuyến buýt." });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const routeId = typeof req.query.routeId === "string" ? req.query.routeId.trim() : "";
    if (!routeId) {
      return res.status(400).json({ message: "Thiếu tham số routeId." });
    }
    const schedule = await busRoutesService.getSchedule(routeId);
    return res.json(schedule);
  } catch (error) {
    console.error("bus-lines schedule error:", error);
    return res.status(500).json({ message: "Không thể tải lịch trình tuyến buýt." });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const created = await busRoutesService.createRoute(req.body || {});
    return res.status(201).json(created);
  } catch (error) {
    console.error("bus-lines create error:", error);
    return res.status(500).json({ message: "Không thể tạo tuyến buýt." });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu id." });
    const updated = await busRoutesService.updateRoute(id, req.body || {});
    return res.json(updated);
  } catch (error) {
    console.error("bus-lines update error:", error);
    return res.status(500).json({ message: "Không thể cập nhật tuyến buýt." });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu id." });
    await busRoutesService.deleteRoute(id);
    return res.status(204).send();
  } catch (error) {
    console.error("bus-lines delete error:", error);
    return res.status(500).json({ message: "Không thể xoá tuyến buýt." });
  }
};
