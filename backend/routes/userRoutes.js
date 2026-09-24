import { Router } from "express";

import User from "../models/User.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, adminOnly, async (req, res) => {
  const users = await User.find()
    .select("-password")
    .sort({
      createdAt: -1,
    })
    .lean();

  res.json(users);
});

export default router;
