import express from "express";
import {
  createCheckout,
  handleCancel,
  satispayWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout", createCheckout);
router.post("/satispay-webhook", express.json(), satispayWebhook);
router.get("/cancel", handleCancel);

export default router;
