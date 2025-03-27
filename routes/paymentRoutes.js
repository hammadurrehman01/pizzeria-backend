import { Router } from "express";

const router = Router();
import { handleFailure, handleSuccess, payForOrder } from "../controllers/paymentController.js";

router.post("/pay-for-order", payForOrder);

router.get("/success", handleSuccess);

router.get("/cancel", handleFailure)

export default router;
