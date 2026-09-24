import Location from "../models/Location.js";

export async function getLocations(req, res) {
  const locations = await Location.find().sort({ name: 1 }).lean();

  res.json(locations);
}

export async function createLocation(req, res) {
  const location = await Location.create(req.body);

  res.status(201).json(location);
}
