import { Router } from "express";

const router = Router();
import {
  handleCancel,
  handleSuccess,
  payForOrder,
} from "../controllers/paymentController.js";

router.post("/pay-for-order", payForOrder);

router.get("/success", handleSuccess);

router.get("/cancel", handleCancel);

export default router;
