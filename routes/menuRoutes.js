import express from "express";
const router = express.Router();
import {
  createMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
} from "../controllers/menuController.js";
import upload from "../middleware/multer.js";

router.get("/", getAllMenuItems);

router
  .route("/:id")
  .get(getMenuItemById)
  .put(updateMenuItem)
  .delete(deleteMenuItem);

router.post("/", upload.single("image"), createMenuItem);

export default router;
