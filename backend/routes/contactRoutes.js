import { Router } from "express";
import { createContactMessage } from "../controllers/contactController.js";

const router = Router();

router.post("/", createContactMessage);

export default router;
