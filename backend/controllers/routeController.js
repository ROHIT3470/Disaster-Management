import { findEvacuationRoute } from "../services/routingService.js";

export async function calculateRoute(req, res) {
  try {
    const { startId, destinationId } = req.body;

    if (!startId || !destinationId) {
      return res.status(400).json({ error: "startId and destinationId are required" });
    }

    const routeData = await findEvacuationRoute(startId, destinationId);
    
    if (!routeData) {
      return res.status(404).json({ error: "No safe route found between these locations." });
    }

    res.status(200).json(routeData);
  } catch (error) {
    console.error("Routing error:", error);
    res.status(500).json({ error: "Failed to calculate route" });
  }
}
