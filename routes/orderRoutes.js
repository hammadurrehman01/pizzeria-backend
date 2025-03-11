import express from "express";
const router = express.Router();
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

router.route("/").get(getAllOrders).post(createOrder);

router
  .route("/:id")
  .put(updateOrderStatus)
  .get(getOrderById)
  .delete(deleteOrder);

export default router;
