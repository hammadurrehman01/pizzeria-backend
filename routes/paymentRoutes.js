import { Router } from "express";

const router = Router();
import { payForOrder } from "../controllers/paymentController.js";

router.post("/pay", payForOrder);

export default router;
