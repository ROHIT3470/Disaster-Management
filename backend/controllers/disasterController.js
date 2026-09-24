import Disaster from "../models/Disaster.js";

export async function getDisasters(req, res) {
  const disasters = await Disaster.find().sort({ date: -1 }).lean();

  res.json(disasters);
}

export async function createDisaster(req, res) {
  const disaster = await Disaster.create(req.body);

  res.status(201).json(disaster);
}
