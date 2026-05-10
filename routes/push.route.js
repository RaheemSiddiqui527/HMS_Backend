import express from "express";
import { subscribe, unsubscribe, getPublicKey } from "../controllers/push.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/key", getPublicKey);
router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);

export default router;
